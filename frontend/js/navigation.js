/**
 * CampusShield Header Navbar & Footer Component Injector
 */
import { initClerk, getCurrentUser, signOutUser } from './auth.js';

export async function renderNavigation() {
  const headerContainer = document.getElementById('app-header');
  const footerContainer = document.getElementById('app-footer');

  let clerk = null;
  try {
    clerk = await initClerk();
  } catch (e) {
    console.warn("Clerk init notice:", e);
  }

  const user = getCurrentUser();
  const currentPath = window.location.pathname;

  if (headerContainer) {
    headerContainer.innerHTML = `
      <header class="sticky top-0 z-50 bg-[#2C3A47] text-[#F4F7F9] shadow-lg border-b border-[#5C6F84]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            
            <!-- Logo -->
            <a href="/index.html" class="flex items-center space-x-3 group">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5C6F84] to-[#A4B4C0] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6 text-[#2C3A47]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <span class="font-extrabold text-xl tracking-tight text-white group-hover:text-[#A4B4C0] transition-colors">
                  CampusShield
                </span>
                <span class="hidden sm:block text-[10px] uppercase tracking-wider text-[#A4B4C0] opacity-80 -mt-1">
                  Grievance Portal
                </span>
              </div>
            </a>

            <!-- Desktop Navigation Links -->
            <nav class="hidden md:flex items-center space-x-2">
              <a href="/index.html" class="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPath.endsWith('index.html') || currentPath === '/'
                  ? 'bg-[#5C6F84] text-[#F4F7F9] font-semibold border border-[#A4B4C0]/40'
                  : 'text-white/90 hover:bg-[#5C6F84]/50 hover:text-[#A4B4C0]'
              }">
                <span>Home</span>
              </a>

              ${(!user || !user.isAdmin) ? `
                <a href="/submit-complaint.html" class="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPath.includes('submit-complaint')
                    ? 'bg-[#5C6F84] text-[#F4F7F9] font-semibold border border-[#A4B4C0]/40'
                    : 'text-white/90 hover:bg-[#5C6F84]/50 hover:text-[#A4B4C0]'
                }">
                  <span>Submit Complaint</span>
                </a>
              ` : ''}

              <a href="/track-complaint.html" class="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPath.includes('track-complaint')
                  ? 'bg-[#5C6F84] text-[#F4F7F9] font-semibold border border-[#A4B4C0]/40'
                  : 'text-white/90 hover:bg-[#5C6F84]/50 hover:text-[#A4B4C0]'
              }">
                <span>Track Complaint</span>
              </a>

              ${user ? `
                <a href="/my-complaints.html" class="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPath.includes('my-complaints') || currentPath.includes('student-dashboard')
                    ? 'bg-[#5C6F84] text-[#F4F7F9] font-semibold border border-[#A4B4C0]/40'
                    : 'text-white/90 hover:bg-[#5C6F84]/50 hover:text-[#A4B4C0]'
                }">
                  <span>My Complaints</span>
                </a>
              ` : ''}

              ${(user && user.isAdmin) ? `
                <a href="/admin-dashboard.html" class="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPath.includes('admin')
                    ? 'bg-[#5C6F84] text-[#A4B4C0] font-semibold border border-[#A4B4C0]/60'
                    : 'text-[#A4B4C0] hover:bg-[#5C6F84]/50 hover:text-white'
                }">
                  <span>Admin Dashboard</span>
                </a>
              ` : ''}
            </nav>

            <!-- Auth Controls -->
            <div class="hidden md:flex items-center space-x-3">
              ${user ? `
                <div class="flex items-center space-x-3 bg-[#5C6F84]/40 px-3 py-1.5 rounded-2xl border border-[#5C6F84]/60">
                  <div class="flex flex-col text-right">
                    <span class="text-xs font-bold text-white truncate max-w-[130px]">${user.firstName || user.name || 'User'}</span>
                    <span class="text-[9px] font-semibold text-gray-300">${user.isAdmin ? 'Administrator' : 'Student'}</span>
                  </div>
                  <!-- Clerk Official User Button Anchor -->
                  <div id="clerk-user-button-desktop"></div>
                  <button id="btn-signout-nav" onclick="window.signOutUser(event)" type="button" class="btn-sign-out px-2.5 py-1 rounded-lg text-xs font-bold bg-[#A4B4C0] text-[#2C3A47] hover:bg-white transition-all shadow-sm cursor-pointer">
                    Sign Out
                  </button>
                </div>
              ` : `
                <div class="flex items-center space-x-2">
                  <a href="/sign-in.html" class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#5C6F84]/40 text-white hover:bg-[#5C6F84] border border-[#5C6F84] transition-all">
                    Sign In
                  </a>
                  <a href="/sign-up.html" class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#A4B4C0] text-[#2C3A47] hover:bg-white transition-all shadow-sm">
                    Sign Up
                  </a>
                </div>
              `}
            </div>

            <!-- Mobile Menu Toggle Button -->
            <div class="flex md:hidden items-center space-x-2">
              <div id="clerk-user-button-mobile"></div>
              <button id="mobile-menu-btn" class="p-2 rounded-lg text-white hover:bg-[#5C6F84]">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Drawer -->
        <div id="mobile-drawer" class="hidden md:hidden bg-[#2C3A47] border-b border-[#5C6F84] px-4 pt-2 pb-4 space-y-2">
          <a href="/index.html" class="block px-4 py-2.5 rounded-lg text-white hover:bg-[#5C6F84]/40">Home</a>
          <a href="/submit-complaint.html" class="block px-4 py-2.5 rounded-lg text-white hover:bg-[#5C6F84]/40">Submit Complaint</a>
          <a href="/track-complaint.html" class="block px-4 py-2.5 rounded-lg text-white hover:bg-[#5C6F84]/40">Track Complaint</a>
          ${user ? `<a href="/my-complaints.html" class="block px-4 py-2.5 rounded-lg text-white hover:bg-[#5C6F84]/40">My Complaints</a>` : ''}
          ${(user && user.isAdmin) ? `<a href="/admin-dashboard.html" class="block px-4 py-2.5 rounded-lg text-[#A4B4C0] hover:bg-[#5C6F84]/40 font-bold">Admin Dashboard</a>` : ''}
          ${user ? `
            <button id="btn-signout-mobile" onclick="window.signOutUser(event)" type="button" class="btn-sign-out w-full text-left px-4 py-2.5 rounded-lg text-red-300 hover:bg-[#5C6F84]/40 font-bold cursor-pointer">
              Sign Out (${user.firstName || 'User'})
            </button>
          ` : `
            <div class="pt-2 flex flex-col space-y-2 border-t border-[#5C6F84]">
              <a href="/sign-in.html" class="w-full text-center py-2.5 rounded-xl bg-[#5C6F84] text-white font-bold text-sm">Sign In</a>
              <a href="/sign-up.html" class="w-full text-center py-2.5 rounded-xl bg-[#A4B4C0] text-[#2C3A47] font-bold text-sm">Sign Up</a>
            </div>
          `}
        </div>
      </header>
    `;

    // Mount Clerk User Button if user is logged in
    if (clerk && clerk.user && clerk.mountUserButton) {
      const desktopUserBtn = document.getElementById('clerk-user-button-desktop');
      const mobileUserBtn = document.getElementById('clerk-user-button-mobile');
      if (desktopUserBtn) clerk.mountUserButton(desktopUserBtn);
      if (mobileUserBtn) clerk.mountUserButton(mobileUserBtn);
    }

    // Attach click listeners to sign out buttons
    document.querySelectorAll('.btn-sign-out').forEach(btn => {
      btn.onclick = (e) => signOutUser(e);
    });

    // Mobile menu toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    if (mobileBtn && mobileDrawer) {
      mobileBtn.addEventListener('click', () => {
        mobileDrawer.classList.toggle('hidden');
      });
    }
  }

  if (footerContainer) {
    footerContainer.innerHTML = `
      <footer class="bg-[#2C3A47] text-[#F4F7F9] border-t border-[#5C6F84] mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div class="space-y-4 md:col-span-2">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-lg bg-[#5C6F84] flex items-center justify-center">
                  <svg class="w-5 h-5 text-[#A4B4C0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <span class="font-extrabold text-lg text-white">CampusShield</span>
              </div>
              <p class="text-xs text-[#A4B4C0] max-w-sm leading-relaxed">
                Official Campus Grievance Redressal Portal ensuring transparent, accountable, and SLA-driven resolution for all student and staff reports.
              </p>
            </div>
            
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-[#A4B4C0] mb-3">Quick Navigation</h4>
              <ul class="space-y-2 text-xs text-gray-300">
                <li><a href="/index.html" class="hover:text-white transition-colors">Home Page</a></li>
                <li><a href="/submit-complaint.html" class="hover:text-white transition-colors">Submit Complaint</a></li>
                <li><a href="/track-complaint.html" class="hover:text-white transition-colors">Track Complaint</a></li>
                <li><a href="/my-complaints.html" class="hover:text-white transition-colors">My Complaints</a></li>
              </ul>
            </div>

            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-[#A4B4C0] mb-3">Emergency Contacts</h4>
              <p class="text-xs text-gray-300 mb-1">Anti-Ragging Helpline: 1800-180-5522</p>
              <p class="text-xs text-gray-300">Campus Control Room: +91 98765 43210</p>
            </div>
          </div>
          
          <div class="border-t border-[#5C6F84] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#A4B4C0]">
            <p>© ${new Date().getFullYear()} CampusShield Grievance Portal. All rights reserved.</p>
            <p class="mt-2 sm:mt-0 font-medium">Empowering Campus Transparency</p>
          </div>
        </div>
      </footer>
    `;
  }
}
