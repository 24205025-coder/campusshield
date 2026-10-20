import { getPublicStats } from './api.js';
import { CATEGORY_NAMES, CATEGORY_DESCRIPTIONS } from './constants.js';

export async function initHomePage() {
  // Fetch stats
  const statTotalEl = document.getElementById('stat-total');
  const statPendingEl = document.getElementById('stat-pending');
  const statInvestigatingEl = document.getElementById('stat-investigating');
  const statResolvedEl = document.getElementById('stat-resolved');

  try {
    const stats = await getPublicStats();
    if (statTotalEl) statTotalEl.textContent = stats.total || 0;
    if (statPendingEl) statPendingEl.textContent = stats.pending || 0;
    if (statInvestigatingEl) statInvestigatingEl.textContent = stats.under_investigation || 0;
    if (statResolvedEl) statResolvedEl.textContent = stats.resolved || 0;
  } catch (err) {
    console.error("Failed to load public stats:", err);
  }

  // Render Category Cards
  const categoryGrid = document.getElementById('category-grid');
  if (categoryGrid) {
    categoryGrid.innerHTML = CATEGORY_NAMES.map(cat => {
      const isSensitive = cat === 'Ragging / Bullying' || cat === 'Harassment';
      const desc = CATEGORY_DESCRIPTIONS[cat] || 'Submit a structured complaint to campus admin.';
      
      return `
        <div data-category="${cat}" class="category-card group cursor-pointer rounded-2xl p-6 bg-white border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between ${
          isSensitive 
            ? 'border-[#5C6F84] bg-gradient-to-b from-white to-[#F0F4F8]' 
            : 'border-[#C2CFDB] hover:border-[#5C6F84]'
        }">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 rounded-xl transition-colors ${
                isSensitive 
                  ? 'bg-[#2C3A47] text-[#A4B4C0]' 
                  : 'bg-[#DCE4EC] text-[#2C3A47] group-hover:bg-[#5C6F84] group-hover:text-white'
              }">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              ${isSensitive ? `
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2C3A47] text-[#A4B4C0] uppercase">
                  Sensitive
                </span>
              ` : ''}
            </div>

            <h3 class="text-lg font-bold text-[#2C3A47] group-hover:text-[#5C6F84] transition-colors">
              ${cat}
            </h3>

            <p class="text-xs text-gray-600 mt-2 leading-relaxed line-clamp-3">
              ${desc}
            </p>
          </div>

          <div class="mt-6 flex items-center text-xs font-bold text-[#5C6F84] group-hover:text-[#2C3A47]">
            <span>Report Issue</span>
            <svg class="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to cards
    document.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        const selectedCat = card.getAttribute('data-category');
        window.location.href = `/submit-complaint.html?category=${encodeURIComponent(selectedCat)}`;
      });
    });
  }
}
