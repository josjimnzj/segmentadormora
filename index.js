document.addEventListener('DOMContentLoaded', () => {
        // --- Global State & Elements ---
        let currentEditorMode = 'create'; 
        let currentSegmentForCampaign = null; 
        let editingSegmentName = null; 
        let selectedSegmentRow = null;
        let appliedFiltersSummaryHTML = '<li>Ninguno</li>';
        let cameFromSegmentEditorWithTemporarySegment = false;

        const screens = { list: document.getElementById('screen-segment-list'), editor: document.getElementById('screen-segment-editor'), campaignCreator: document.getElementById('screen-campaign-list-creator'),};
        const modals = { confirmDelete: document.getElementById('modal-confirm-delete'), viewDetails: document.getElementById('modal-view-details'), saveSegment: document.getElementById('modal-save-segment'), requireSegmentName: document.getElementById('modal-require-segment-name'), confirmCancelList: document.getElementById('modal-confirm-cancel-list-creation'), listSavedNav: document.getElementById('modal-list-saved-navigation') };
        const toast = { element: document.getElementById('toast-notification'), message: document.getElementById('toast-message'), closeButton: document.getElementById('btn-close-toast'),};
        const actionBtnUseSelected = document.getElementById('action-btn-use-selected-segment');
        const actionBtnEditSelected = document.getElementById('action-btn-edit-selected-segment');
        const actionBtnDuplicateSelected = document.getElementById('action-btn-duplicate-selected-segment');
        const actionBtnDeleteSelected = document.getElementById('action-btn-delete-selected-segment');
        const segmentTableBody = document.getElementById('segment-table-body');
        const segmentTable = segmentTableBody ? segmentTableBody.closest('table') : null;
        if (segmentTable && segmentTable.tHead === null) {
            const thead = document.createElement('thead');
            thead.className = 'bg-[#f3f3f3]';
            thead.innerHTML = `<tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-[#226693] uppercase tracking-wider">Nombre del Segmento</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-[#226693] uppercase tracking-wider">Descripción</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-[#226693] uppercase tracking-wider">N.º de Cuentas</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-[#226693] uppercase tracking-wider">Tipo</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-[#226693] uppercase tracking-wider">Creación</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-[#226693] uppercase tracking-wider">Modificación</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-[#226693] uppercase tracking-wider">Creado por</th>
            </tr>`;
            segmentTable.insertBefore(thead, segmentTable.firstChild);
        }
        if (segmentTable && !segmentTableBody) {
            const tbody = document.createElement('tbody');
            tbody.id = 'segment-table-body';
            tbody.className = 'bg-[#ffffff] divide-y divide-[#ededed]';
            segmentTable.appendChild(tbody);
        }
        const segmentEditorTitle = document.getElementById('segment-editor-title');
        const segmentIdFields = document.getElementById('segment-identification-fields');
        const segmentNameInput = document.getElementById('segment-name');
        const segmentDescriptionInput = document.getElementById('segment-description');
        const segmentForm = document.getElementById('segment-form');
        const filteredAccountsCountEl = document.getElementById('filtered-accounts-count');
        const previewLoadingSpinner = document.getElementById('preview-loading-spinner');
        const previewTableBody = document.getElementById('preview-table-body');
        const btnUpdatePreviewFilters = document.getElementById('btn-update-preview-filters');
        const btnCleanPreviewFilters = document.getElementById('btn-clean-preview-filters');
        
        const segmentPreviewAndSummaryContainer = document.getElementById('segment-preview-and-summary-container'); 
        const filtersPanelContainer = document.getElementById('segment-filters-panel-container');
        const btnToggleFiltersPanel = document.getElementById('btn-toggle-filters-panel');
        const filtersPanelContentMain = document.getElementById('filters-panel-content-main'); 
        const filtersSummaryDisplay = document.getElementById('filters-summary-display'); 
        const filtersSummaryList = document.getElementById('filters-summary-list');
        const chevronIconFilters = document.getElementById('chevron-icon-filters');
        const filtersPanelTitle = document.getElementById('filters-panel-title');
        
        const modalSaveSegmentName = document.getElementById('modal-save-segment-name');
        const modalSaveSegmentDescription = document.getElementById('modal-save-segment-description');
        const modalSaveSegmentFiltersSummary = document.getElementById('modal-save-segment-filters-summary');
        let saveModalContext = 'saveOnly';
        
        const campaignSelectedSegmentNameEl = document.getElementById('campaign-selected-segment-name');
        const campaignSelectedSegmentAccountsEl = document.getElementById('campaign-selected-segment-accounts');
        const btnAssignSegmentNameOnListCreator = document.getElementById('btn-assign-segment-name-on-list-creator');
        const campaignListForm = document.getElementById('campaign-list-form');
        const listDescriptionInput = document.getElementById('list-description');
        const listTypeSelect = document.getElementById('list-type');
        const listPriorityInput = document.getElementById('list-priority'); 
        const tabButtons = document.querySelectorAll('#asociados-tabs .tab-button');
        const tabContents = document.querySelectorAll('#asociados-tabs .tab-content');
        const plannedActivitiesList = document.getElementById('planned-activities-list');
        const activityCardTemplate = document.getElementById('activity-card-template');
        let activityCounter = 0;

        const modalRequireSegmentNameInput = document.getElementById('modal-require-segment-name-input');
        const modalRequireSegmentDescriptionInput = document.getElementById('modal-require-segment-description-input');
        const btnModalRequireNameSalir = document.getElementById('btn-modal-require-name-salir'); 
        const btnModalRequireNameGrabar = document.getElementById('btn-modal-require-name-grabar'); 
        const errorModalRequireSegmentName = document.getElementById('error-modal-require-segment-name');

        const btnConfirmCancelListYes = document.getElementById('btn-confirm-cancel-list-yes');
        const btnConfirmCancelListNo = document.getElementById('btn-confirm-cancel-list-no');

        const listSavedMessageEl = document.getElementById('list-saved-message');
        const btnListSavedGotoSegments = document.getElementById('btn-list-saved-goto-segments');
        const btnListSavedGotoCampaign = document.getElementById('btn-list-saved-goto-campaign');


        function showScreen(screenId) { Object.values(screens).forEach(s => s.classList.add('hidden')); if (screens[screenId]) screens[screenId].classList.remove('hidden'); window.scrollTo(0, 0); }
        function openModal(modalId) { if (modals[modalId]) { modals[modalId].classList.add('is-open'); document.body.style.overflow = 'hidden'; } }
        function closeModal(modalId) { if (modals[modalId]) { modals[modalId].classList.remove('is-open'); document.body.style.overflow = ''; } }
        let toastTimeout;
        function showToast(message, duration = 3000) { if(toast.message) toast.message.textContent = message; if(toast.element) { toast.element.style.display = 'block'; toast.element.style.opacity = '1'; clearTimeout(toastTimeout); toastTimeout = setTimeout(() => { toast.element.style.opacity = '0'; setTimeout(() => { if(toast.element) toast.element.style.display = 'none'; }, 500); }, duration); } }
        if(toast.closeButton) { toast.closeButton.addEventListener('click', () => { clearTimeout(toastTimeout); if(toast.element) { toast.element.style.opacity = '0'; setTimeout(() => { if(toast.element) toast.element.style.display = 'none'; }, 500); } }); }

        document.getElementById('btn-show-create-segment').addEventListener('click', () => setupSegmentEditor('create'));
        document.getElementById('btn-cancel-segment-editor').addEventListener('click', () => showScreen('list'));
        const breadcrumbCampaign = document.getElementById('breadcrumb-back-to-list-from-campaign');
        if (breadcrumbCampaign) breadcrumbCampaign.addEventListener('click', () => showScreen('list'));
        
        const btnCancelCampaignList = document.getElementById('btn-cancel-campaign-list');
        if(btnCancelCampaignList) {
            btnCancelCampaignList.addEventListener('click', () => {
                openModal('confirmCancelList'); 
            });
        }
        const btnBackToSegmentEditorFromList = document.getElementById('btn-back-to-segment-editor-from-list');
        if(btnBackToSegmentEditorFromList) {
            btnBackToSegmentEditorFromList.addEventListener('click', () => {
                showScreen('editor');
            });
        }


        function updateSegmentActionButtonsState() { const isRowSelected = selectedSegmentRow !== null; const segmentType = isRowSelected ? selectedSegmentRow.dataset.segmentType : null; if(actionBtnUseSelected) actionBtnUseSelected.disabled = !isRowSelected; if(actionBtnEditSelected) actionBtnEditSelected.disabled = !isRowSelected || segmentType === 'predefinido'; if(actionBtnDuplicateSelected) actionBtnDuplicateSelected.disabled = !isRowSelected; if(actionBtnDeleteSelected) actionBtnDeleteSelected.disabled = !isRowSelected || segmentType === 'predefinido';}
        if(segmentTableBody) {
            segmentTableBody.addEventListener('click', (e) => { const row = e.target.closest('tr.segment-row'); if (!row) return; if (selectedSegmentRow) selectedSegmentRow.classList.remove('selected-row'); row.classList.add('selected-row'); selectedSegmentRow = row; updateSegmentActionButtonsState(); });
            segmentTableBody.addEventListener('dblclick', (e) => { const row = e.target.closest('tr.segment-row'); if (!row) return; document.getElementById('details-segment-name-modal').textContent = row.dataset.segmentName; document.getElementById('details-segment-description-modal').textContent = row.dataset.segmentDescription || 'N/A'; document.getElementById('details-segment-filters-modal').innerHTML = `<li>Filtro Ejemplo 1 para ${row.dataset.segmentName}</li><li>Filtro Ejemplo 2</li>`; document.getElementById('details-accounts-sample-modal').innerHTML = `<tr><td class="px-3 py-2 text-sm">ACC789</td><td class="px-3 py-2 text-sm">Cliente Detalle</td><td class="px-3 py-2 text-sm">45</td><td class="px-3 py-2 text-sm">$300</td></tr>`; openModal('viewDetails'); });
        }
        if(actionBtnUseSelected) actionBtnUseSelected.addEventListener('click', () => { if (!selectedSegmentRow) return; currentSegmentForCampaign = { name: selectedSegmentRow.dataset.segmentName, accounts: selectedSegmentRow.dataset.segmentAccounts || 'N/A' }; setupCampaignListCreator(false); });
        if(actionBtnEditSelected) actionBtnEditSelected.addEventListener('click', () => { if (!selectedSegmentRow || selectedSegmentRow.dataset.segmentType === 'predefinido') return; setupSegmentEditor('edit', selectedSegmentRow.dataset.segmentName); });
        if(actionBtnDuplicateSelected) actionBtnDuplicateSelected.addEventListener('click', () => { if (!selectedSegmentRow) return; setupSegmentEditor('duplicate', selectedSegmentRow.dataset.segmentName); });
        if(actionBtnDeleteSelected) actionBtnDeleteSelected.addEventListener('click', () => { if (!selectedSegmentRow || selectedSegmentRow.dataset.segmentType === 'predefinido') return; document.getElementById('delete-segment-name-modal').textContent = selectedSegmentRow.dataset.segmentName; modals.confirmDelete.dataset.segmentToDelete = selectedSegmentRow.dataset.segmentName; openModal('confirmDelete'); });
        const btnCancelDeleteModal = document.getElementById('btn-cancel-delete-modal'); if(btnCancelDeleteModal) btnCancelDeleteModal.addEventListener('click', () => closeModal('confirmDelete'));
        const btnConfirmDeleteModal = document.getElementById('btn-confirm-delete-modal'); if(btnConfirmDeleteModal) btnConfirmDeleteModal.addEventListener('click', () => { const segmentToDelete = modals.confirmDelete.dataset.segmentToDelete; if(selectedSegmentRow && selectedSegmentRow.dataset.segmentName === segmentToDelete) { selectedSegmentRow.remove(); selectedSegmentRow = null; updateSegmentActionButtonsState(); } showToast(`Segmento "${segmentToDelete}" eliminado.`); closeModal('confirmDelete'); });
        const btnCloseDetailsModal = document.getElementById('btn-close-details-modal'); if(btnCloseDetailsModal) btnCloseDetailsModal.addEventListener('click', () => closeModal('viewDetails'));
        const btnModalCancelSaveSegment = document.getElementById('btn-modal-cancel-save-segment'); if(btnModalCancelSaveSegment) btnModalCancelSaveSegment.addEventListener('click', () => closeModal('saveSegment'));

        function setupSegmentEditor(mode, segmentName = '') {
            currentEditorMode = mode; editingSegmentName = segmentName;
            if (segmentForm) segmentForm.reset();
            document.querySelectorAll('#filters-panel-content-main .collapsible-content').forEach(c => { c.classList.add('hidden'); const chevron = c.previousElementSibling.querySelector('.chevron-icon'); if(chevron) chevron.classList.remove('rotate-180'); });
            document.querySelectorAll('#segment-form .error-message').forEach(el => el.classList.add('hidden'));
            if(previewTableBody) previewTableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-[#6e6e6e]">Aplique filtros y presione \'Filtrar\' para ver la previsualización.</td></tr>';
            if(filteredAccountsCountEl) filteredAccountsCountEl.textContent = '0';
            const paginationEl = document.getElementById('preview-pagination'); if(paginationEl) paginationEl.classList.add('hidden');
            appliedFiltersSummaryHTML = '<li>Ninguno</li>'; 
            if(filtersSummaryList) filtersSummaryList.innerHTML = appliedFiltersSummaryHTML; 
            
            if(filtersPanelContainer) {
                filtersPanelContainer.classList.remove('panel-collapsed', 'md:w-20', 'lg:w-20');
                filtersPanelContainer.classList.add('md:w-2/5', 'lg:w-1/3'); 
            }
            if(segmentPreviewAndSummaryContainer) { 
                segmentPreviewAndSummaryContainer.classList.remove('md:flex-1');
                segmentPreviewAndSummaryContainer.classList.add('md:w-3/5', 'lg:w-2/3'); 
            }
            if(filtersPanelContentMain) filtersPanelContentMain.classList.remove('hidden');
            if(chevronIconFilters) chevronIconFilters.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />'; 
            if(filtersPanelTitle) filtersPanelTitle.textContent = "Panel de Filtros";

            if (mode === 'create') {
                if(segmentEditorTitle) segmentEditorTitle.textContent = 'Crear Nuevo Segmento';
                if(segmentIdFields) segmentIdFields.classList.add('hidden'); 
                if(segmentNameInput) segmentNameInput.required = false;
            } else {
                if(segmentIdFields) segmentIdFields.classList.remove('hidden');
                if(segmentNameInput) segmentNameInput.required = true;
                if (mode === 'edit') { if(segmentEditorTitle) segmentEditorTitle.textContent = `Editar Segmento: ${segmentName}`; if(segmentNameInput) segmentNameInput.value = segmentName; } 
                else { if(segmentEditorTitle) segmentEditorTitle.textContent = `Duplicar Segmento: ${segmentName}`; if(segmentNameInput) segmentNameInput.value = `${segmentName} (Copia)`; }
                updateFilteredAccountsPreview(); updateAppliedFiltersSummary();
            }
            showScreen('editor');
        }
        
        if(btnUpdatePreviewFilters) btnUpdatePreviewFilters.addEventListener('click', () => { updateFilteredAccountsPreview(); updateAppliedFiltersSummary(); });
        if(btnCleanPreviewFilters) btnCleanPreviewFilters.addEventListener('click', () => {
            if(segmentForm) { document.querySelectorAll('#filters-panel-content-main .input-filter').forEach(input => { if(input.type === 'checkbox' || input.type === 'radio') input.checked = false; else if (input.tagName === 'SELECT') input.selectedIndex = 0; else input.value = ''; });}
            updateFilteredAccountsPreview(); updateAppliedFiltersSummary(); showToast("Filtros limpiados.");
        });

        document.querySelectorAll('#filters-panel-content-main .collapsible-trigger').forEach(button => {
            button.addEventListener('click', () => { const content = button.nextElementSibling; const chevron = button.querySelector('.chevron-icon'); if(content) content.classList.toggle('hidden'); if(chevron) chevron.classList.toggle('rotate-180'); if(content) button.setAttribute('aria-expanded', content.classList.contains('hidden') ? 'false' : 'true'); });
        });
        
        function updateFilteredAccountsPreview() {
            if(previewLoadingSpinner) previewLoadingSpinner.classList.remove('hidden');
            setTimeout(() => {
                const randomCount = Math.floor(Math.random() * 2000) + 50; 
                if(filteredAccountsCountEl) filteredAccountsCountEl.textContent = randomCount.toLocaleString('es-ES');
                if(previewTableBody) previewTableBody.innerHTML = ''; 
                if (randomCount > 0) {
                    const sampleSize = Math.min(randomCount, 5); 
                    for (let i = 0; i < sampleSize; i++) { const rowHTML = `<tr><td class="px-4 py-2 text-sm">ACC${String(Math.floor(Math.random()*900)+100).padStart(3, '0')}</td><td class="px-4 py-2 text-sm">Cliente Ejemplo ${i+1}</td><td class="px-4 py-2 text-sm">${Math.floor(Math.random()*180)+30}</td><td class="px-4 py-2 text-sm">$${(Math.random()*2000+100).toFixed(2)}</td><td class="px-4 py-2 text-sm">${new Date(Date.now() - Math.random()*30*24*60*60*1000).toLocaleDateString()}</td></tr>`; if(previewTableBody) previewTableBody.insertAdjacentHTML('beforeend', rowHTML); }
                    const paginationEl = document.getElementById('preview-pagination'); if(paginationEl) paginationEl.classList.remove('hidden');
                } else {
                    if(previewTableBody) previewTableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-[#6e6e6e]">No hay cuentas que coincidan con estos filtros.</td></tr>';
                    const paginationEl = document.getElementById('preview-pagination'); if(paginationEl) paginationEl.classList.add('hidden');
                }
                if(previewLoadingSpinner) previewLoadingSpinner.classList.add('hidden');
            }, 500);
        }

        function getFilterLabel(inputElement) { const id = inputElement.id; if (id) { const label = document.querySelector(`label[for="${id}"]`); return label ? label.textContent.trim().replace(':', '') : inputElement.name || id; } return inputElement.name || 'Filtro Desconocido';}
        function updateAppliedFiltersSummary() {
            const summaryItems = []; const activeFilterInputs = document.querySelectorAll('#filters-panel-content-main .input-filter');
            activeFilterInputs.forEach(input => {
                let displayValue = ''; const filterName = getFilterLabel(input);
                if (input.type === 'checkbox' || input.type === 'radio') { if (input.checked) displayValue = input.labels && input.labels.length > 0 ? input.labels[0].textContent.trim() : 'Sí'; } 
                else if (input.tagName === 'SELECT') { if (input.value && input.value !== "") { if (input.multiple) { const selectedOptions = Array.from(input.selectedOptions).map(opt => opt.text); if (selectedOptions.length > 0) displayValue = selectedOptions.join(', '); } else { if (input.options[input.selectedIndex] && input.options[input.selectedIndex].text !== 'Cualquiera' && input.options[input.selectedIndex].text !== 'Todas' && input.options[input.selectedIndex].text !== 'Todos' && input.options[input.selectedIndex].text !== 'Personalizado' && input.options[input.selectedIndex].text !== 'Seleccione un tipo' && input.options[input.selectedIndex].text !== 'Seleccione prioridad' && input.options[input.selectedIndex].text !== 'Seleccione método') { displayValue = input.options[input.selectedIndex].text; } } } } 
                else { if (input.value) displayValue = input.value; }
                if (displayValue) { summaryItems.push(`<li><strong>${filterName}:</strong> ${displayValue}</li>`); }
            });
            if (summaryItems.length > 0) { appliedFiltersSummaryHTML = summaryItems.join(''); } else { appliedFiltersSummaryHTML = '<li>Ninguno</li>'; }
            if(filtersSummaryList) filtersSummaryList.innerHTML = appliedFiltersSummaryHTML; 
        }
        
        if(btnToggleFiltersPanel) {
            btnToggleFiltersPanel.addEventListener('click', () => {
                const isCurrentlyCollapsed = filtersPanelContainer.classList.contains('panel-collapsed');
                if (isCurrentlyCollapsed) { 
                    filtersPanelContainer.classList.remove('panel-collapsed', 'md:w-20', 'lg:w-20');
                    filtersPanelContainer.classList.add('md:w-2/5', 'lg:w-1/3');
                    if(segmentPreviewAndSummaryContainer) {
                        segmentPreviewAndSummaryContainer.classList.remove('md:flex-1');
                        segmentPreviewAndSummaryContainer.classList.add('md:w-3/5', 'lg:w-2/3');
                    }
                    if(filtersPanelContentMain) filtersPanelContentMain.classList.remove('hidden');
                    if(chevronIconFilters) chevronIconFilters.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />'; 
                    if(filtersPanelTitle) filtersPanelTitle.textContent = "Panel de Filtros";
                } else { 
                    updateAppliedFiltersSummary(); 
                    filtersPanelContainer.classList.add('panel-collapsed', 'md:w-20', 'lg:w-20');
                    filtersPanelContainer.classList.remove('md:w-2/5', 'lg:w-1/3');
                     if(segmentPreviewAndSummaryContainer) {
                        segmentPreviewAndSummaryContainer.classList.remove('md:w-3/5', 'lg:w-2/3');
                        segmentPreviewAndSummaryContainer.classList.add('md:flex-1'); 
                    }
                    if(filtersPanelContentMain) filtersPanelContentMain.classList.add('hidden');
                    if(chevronIconFilters) chevronIconFilters.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />'; 
                    if(filtersPanelTitle) filtersPanelTitle.textContent = "Filtros";
                }
            });
        }
        
        const btnSaveSegmentOnlyEditor = document.getElementById('btn-save-segment-only');
        if(btnSaveSegmentOnlyEditor) btnSaveSegmentOnlyEditor.addEventListener('click', () => {
            if (currentEditorMode === 'create' && segmentIdFields && segmentIdFields.classList.contains('hidden')) {
                segmentIdFields.classList.remove('hidden');
                if (segmentNameInput && !segmentNameInput.value.trim()) {
                    openSaveSegmentModal('saveOnly');
                    return;
                }
            }
            const isNameEmptyForSaving = (segmentNameInput && !segmentNameInput.value.trim());
            if (isNameEmptyForSaving) {
                if (currentEditorMode === 'create') openSaveSegmentModal('saveOnly');
                else {
                    const errorEl = document.getElementById('error-segment-name');
                    if(errorEl) errorEl.classList.remove('hidden');
                    if(segmentNameInput) segmentNameInput.focus();
                }
                return;
            }
            const errorEl = document.getElementById('error-segment-name');
            if(errorEl) errorEl.classList.add('hidden');
            const nameToSave = segmentNameInput ? segmentNameInput.value : 'Nuevo Segmento';
            const descToSave = segmentDescriptionInput ? segmentDescriptionInput.value : '';
            // Añadir el nuevo segmento a la tabla
            const tbody = document.getElementById('segment-table-body');
            if(tbody) {
                const now = new Date();
                const fecha = now.toLocaleDateString('es-ES');
                const row = document.createElement('tr');
                row.className = 'segment-row cursor-pointer hover:bg-[#f0f9ff]';
                row.dataset.segmentName = nameToSave;
                row.dataset.segmentType = 'personalizado';
                row.dataset.segmentDescription = descToSave;
                row.dataset.segmentAccounts = filteredAccountsCountEl ? filteredAccountsCountEl.textContent : '0';
                row.innerHTML = `
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-[#074863] font-medium">${nameToSave}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-[#6e6e6e]">${descToSave}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-[#6e6e6e]">${filteredAccountsCountEl ? filteredAccountsCountEl.textContent : '0'}</td>
                    <td class="px-4 py-3 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#ededed] text-[#226693]">Personalizado</span></td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-[#6e6e6e]">${fecha}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-[#6e6e6e]">${fecha}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-[#6e6e6e]">Usuario</td>
                `;
                tbody.appendChild(row);
            }
            showToast(`Segmento "${nameToSave}" grabado.`);
            showScreen('list');
        });
        
        const btnUseSegmentForCampaign = document.getElementById('btn-use-segment-for-campaign');
        if(btnUseSegmentForCampaign) btnUseSegmentForCampaign.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const isNewAndNameFieldEmpty = currentEditorMode === 'create' && segmentNameInput && !segmentNameInput.value.trim() && segmentDescriptionInput && !segmentDescriptionInput.value.trim(); 
            if (isNewAndNameFieldEmpty) { 
                updateAppliedFiltersSummary(); 
                currentSegmentForCampaign = { name: "Temporal, segmento no guardado", accounts: filteredAccountsCountEl ? filteredAccountsCountEl.textContent : '0' }; 
                setupCampaignListCreator(true); 
            } else { 
                openSaveSegmentModal('saveAndUse'); 
            } 
        });

        function openSaveSegmentModal(context) { 
            saveModalContext = context; 
            if(modalSaveSegmentName) modalSaveSegmentName.value = segmentNameInput ? segmentNameInput.value : ''; 
            if(modalSaveSegmentDescription) modalSaveSegmentDescription.value = segmentDescriptionInput ? segmentDescriptionInput.value : ''; 
            if(modalSaveSegmentFiltersSummary) modalSaveSegmentFiltersSummary.innerHTML = appliedFiltersSummaryHTML; 
            const errorModalName = document.getElementById('error-modal-save-segment-name'); 
            if(errorModalName) errorModalName.classList.add('hidden'); 
            openModal('saveSegment');
        }
        
        const btnModalSaveOnlySegment = document.getElementById('btn-modal-save-only-segment'); 
        if(btnModalSaveOnlySegment) btnModalSaveOnlySegment.addEventListener('click', () => { 
            const name = modalSaveSegmentName ? modalSaveSegmentName.value.trim() : ''; 
            if (!name) { const errorModalName = document.getElementById('error-modal-save-segment-name'); if(errorModalName) errorModalName.classList.remove('hidden'); return; } 
            showToast(`Segmento "${name}" grabado.`); closeModal('saveSegment'); showScreen('list'); 
        });
        
        const btnModalSaveAndUseCampaign = document.getElementById('btn-modal-save-and-use-campaign'); 
        if(btnModalSaveAndUseCampaign) btnModalSaveAndUseCampaign.addEventListener('click', () => { 
            const name = modalSaveSegmentName ? modalSaveSegmentName.value.trim() : ''; 
            if (!name) { const errorModalName = document.getElementById('error-modal-save-segment-name'); if(errorModalName) errorModalName.classList.remove('hidden'); return; } 
            currentSegmentForCampaign = { name: name, accounts: filteredAccountsCountEl ? filteredAccountsCountEl.textContent : 'N/A' }; 
            showToast(`Segmento "${name}" grabado.`); closeModal('saveSegment'); 
            setupCampaignListCreator(false); 
        });
        
        function setupCampaignListCreator(isTemporary = false) { 
            cameFromSegmentEditorWithTemporarySegment = isTemporary; 
            if(campaignSelectedSegmentNameEl) campaignSelectedSegmentNameEl.textContent = currentSegmentForCampaign.name; 
            if(campaignSelectedSegmentAccountsEl) campaignSelectedSegmentAccountsEl.textContent = `${currentSegmentForCampaign.accounts} cuentas`; 
            
            if(btnAssignSegmentNameOnListCreator) {
                btnAssignSegmentNameOnListCreator.classList.toggle('hidden', !isTemporary);
            }

            if(isTemporary && campaignSelectedSegmentNameEl) { 
                campaignSelectedSegmentNameEl.textContent = "Temporal, segmento no guardado"; 
                if(campaignSelectedSegmentAccountsEl) campaignSelectedSegmentAccountsEl.textContent = `${filteredAccountsCountEl ? filteredAccountsCountEl.textContent : '0'} cuentas (estimado)`;
            } 
            if(campaignListForm) campaignListForm.reset(); 
            tabButtons.forEach((btn, index) => { const target = document.getElementById(btn.dataset.tabTarget); btn.classList.toggle('border-[#009cdb]', index === 0); btn.classList.toggle('text-[#009cdb]', index === 0); btn.classList.toggle('border-transparent', index !== 0); btn.classList.toggle('text-[#6e6e6e]', index !== 0); if(target) target.classList.toggle('hidden', index !== 0); }); 
            if(plannedActivitiesList) plannedActivitiesList.innerHTML = '<p id="no-activities-message" class="text-sm text-[#6e6e6e]">No hay actividades planificadas.</p>'; 
            activityCounter = 0; 
            showScreen('campaignCreator');
        }

        if(btnAssignSegmentNameOnListCreator) {
            btnAssignSegmentNameOnListCreator.addEventListener('click', () => {
                if (modalRequireSegmentNameInput) modalRequireSegmentNameInput.value = '';
                if (modalRequireSegmentDescriptionInput) modalRequireSegmentDescriptionInput.value = '';
                if (errorModalRequireSegmentName) errorModalRequireSegmentName.classList.add('hidden');
                openModal('requireSegmentName');
            });
        }

        if(btnModalRequireNameSalir) btnModalRequireNameSalir.addEventListener('click', () => closeModal('requireSegmentName'));
        // The red "Cancelar Creación Lista" button from modal-require-segment-name was removed as per request.
        // The main "Cancelar" button on the campaign list creator screen handles general cancellation with confirmation.
        
        if(btnConfirmCancelListYes) btnConfirmCancelListYes.addEventListener('click', () => {
            closeModal('confirmCancelList');
            closeModal('requireSegmentName'); 
            showScreen('list');
            showToast("Creación de lista cancelada.");
        });
        if(btnConfirmCancelListNo) btnConfirmCancelListNo.addEventListener('click', () => {
            closeModal('confirmCancelList');
        });

        if(btnModalRequireNameGrabar) { 
            btnModalRequireNameGrabar.addEventListener('click', () => {
                const newName = modalRequireSegmentNameInput ? modalRequireSegmentNameInput.value.trim() : '';
                if (!newName) {
                    if(errorModalRequireSegmentName) errorModalRequireSegmentName.classList.remove('hidden');
                    return;
                }
                if(errorModalRequireSegmentName) errorModalRequireSegmentName.classList.add('hidden');
                
                currentSegmentForCampaign.name = newName;
                currentSegmentForCampaign.description = modalRequireSegmentDescriptionInput ? modalRequireSegmentDescriptionInput.value.trim() : ''; 
                
                if(campaignSelectedSegmentNameEl) campaignSelectedSegmentNameEl.textContent = newName;
                showToast(`Segmento "${newName}" grabado.`);
                cameFromSegmentEditorWithTemporarySegment = false; 
                if(btnAssignSegmentNameOnListCreator) btnAssignSegmentNameOnListCreator.classList.add('hidden');
                closeModal('requireSegmentName');
            });
        }


        tabButtons.forEach(button => { button.addEventListener('click', () => { tabButtons.forEach(btn => { btn.classList.remove('border-[#009cdb]', 'text-[#009cdb]'); btn.classList.add('border-transparent', 'text-[#6e6e6e]'); }); button.classList.add('border-[#009cdb]', 'text-[#009cdb]'); button.classList.remove('border-transparent', 'text-[#6e6e6e]'); tabContents.forEach(content => content.classList.add('hidden')); const targetContent = document.getElementById(button.dataset.tabTarget); if(targetContent) targetContent.classList.remove('hidden'); }); });
        const btnAddActivity = document.getElementById('btn-add-activity');
        if(btnAddActivity) btnAddActivity.addEventListener('click', () => { const noMsgEl = plannedActivitiesList ? plannedActivitiesList.querySelector('#no-activities-message') : null; if (noMsgEl) noMsgEl.classList.add('hidden'); if (!activityCardTemplate) return; const newActivityCardContent = activityCardTemplate.content.cloneNode(true); const cardElement = newActivityCardContent.querySelector('.activity-card'); if(!cardElement) return; cardElement.dataset.activityId = `activity-${activityCounter++}`; const typeSelect = cardElement.querySelector('.activity-type'); const typeDisplay = cardElement.querySelector('.activity-type-display'); const cardBody = cardElement.querySelector('.activity-card-body'); const chevronIcon = cardElement.querySelector('.activity-card-header .chevron-icon'); if(cardBody) cardBody.classList.remove('hidden'); if(chevronIcon) chevronIcon.classList.add('rotate-180'); const fieldAsunto = cardElement.querySelector('.activity-field-asunto'); const fieldTemplate = cardElement.querySelector('.activity-field-template'); const fieldScript = cardElement.querySelector('.activity-field-script'); const fieldEncuesta = cardElement.querySelector('.activity-field-encuesta'); function updateActivityFields(selectedType) { if(fieldAsunto) fieldAsunto.classList.toggle('hidden', !['llamada', 'visita'].includes(selectedType)); if(fieldTemplate) fieldTemplate.classList.toggle('hidden', !['email', 'sms', 'whatsapp'].includes(selectedType)); if(fieldScript) fieldScript.classList.toggle('hidden', selectedType !== 'llamada'); if(fieldEncuesta) fieldEncuesta.classList.toggle('hidden', selectedType !== 'llamada');} if(typeSelect && typeDisplay) { typeDisplay.textContent = typeSelect.options[typeSelect.selectedIndex].text; updateActivityFields(typeSelect.value); typeSelect.addEventListener('change', (e) => { typeDisplay.textContent = e.target.options[e.target.selectedIndex].text; updateActivityFields(e.target.value); });} const planningTypeSelect = cardElement.querySelector('.activity-planning-type'); const dateSpecificDiv = cardElement.querySelector('.activity-date-specific'); const daysAfterDiv = cardElement.querySelector('.activity-days-after'); if(planningTypeSelect && dateSpecificDiv && daysAfterDiv) { planningTypeSelect.addEventListener('change', (e) => { dateSpecificDiv.classList.add('hidden'); daysAfterDiv.classList.add('hidden'); if (e.target.value === 'fecha_especifica') dateSpecificDiv.classList.remove('hidden'); else if (e.target.value === 'post_dias_campana' || e.target.value === 'post_inicio_mora') daysAfterDiv.classList.remove('hidden'); });} const cardHeader = cardElement.querySelector('.activity-card-header'); if(cardHeader && cardBody && chevronIcon) { cardHeader.addEventListener('click', (e) => { if(e.target.closest('.btn-remove-activity')) return; cardBody.classList.toggle('hidden'); chevronIcon.classList.toggle('rotate-180'); });} if(plannedActivitiesList) plannedActivitiesList.appendChild(newActivityCardContent); });
        if(plannedActivitiesList) plannedActivitiesList.addEventListener('click', (e) => { const targetButton = e.target.closest('button'); if (!targetButton) return; const activityCard = targetButton.closest('.activity-card'); if (!activityCard) return; if (targetButton.classList.contains('btn-remove-activity')) { activityCard.remove(); const noMsgEl = plannedActivitiesList.querySelector('#no-activities-message'); if (plannedActivitiesList.children.length === 1 && noMsgEl) noMsgEl.classList.remove('hidden'); else if (plannedActivitiesList.children.length === 0 && !noMsgEl) plannedActivitiesList.innerHTML = '<p id="no-activities-message" class="text-sm text-[#6e6e6e]">No hay actividades planificadas.</p>'; } });
        
        const btnSaveCampaignList = document.getElementById('btn-save-campaign-list');
        if(btnSaveCampaignList) {
            btnSaveCampaignList.addEventListener('click', (e) => {
                e.preventDefault(); 
                
                // User can save list even with temporary segment. No forced naming here.
                let isValid = true;
                const listDescError = document.getElementById('error-list-description');
                const listTypeError = document.getElementById('error-list-type');
                const listPriorityError = document.getElementById('error-list-priority');
                if (listDescriptionInput && !listDescriptionInput.value.trim()) { if(listDescError) listDescError.classList.remove('hidden'); if(listDescriptionInput) listDescriptionInput.focus();isValid = false; } else { if(listDescError) listDescError.classList.add('hidden'); } 
                if (listTypeSelect && !listTypeSelect.value) { if(listTypeError) listTypeError.classList.remove('hidden'); if(isValid && listTypeSelect) listTypeSelect.focus(); isValid = false; } else { if(listTypeError) listTypeError.classList.add('hidden'); } 
                if(listPriorityInput && (!listPriorityInput.value || parseInt(listPriorityInput.value) < 1)) { if(listPriorityError) listPriorityError.classList.remove('hidden'); if(isValid && listPriorityInput) listPriorityInput.focus(); isValid = false; } else { if(listPriorityError) listPriorityError.classList.add('hidden');} 
                if (!isValid) return; 
                const listName = listDescriptionInput ? (listDescriptionInput.value.trim().substring(0,20) + "...") : "Nueva Lista"; 
                
                let finalListNameForMessage = listName;
                if (currentSegmentForCampaign && currentSegmentForCampaign.name === "Temporal, segmento no guardado") {
                    finalListNameForMessage = `${listName} (con segmento temporal)`;
                } else if (currentSegmentForCampaign) {
                     finalListNameForMessage = `${listName} (con segmento: ${currentSegmentForCampaign.name})`;
                }

                if(listSavedMessageEl) listSavedMessageEl.textContent = `¡Éxito! La lista '${finalListNameForMessage}' ha sido creada y añadida a la Campaña de Mora Express.`;
                openModal('listSavedNav');
            });
        }

        if(btnListSavedGotoSegments) btnListSavedGotoSegments.addEventListener('click', () => { closeModal('listSavedNav'); showScreen('list'); });
        if(btnListSavedGotoCampaign) btnListSavedGotoCampaign.addEventListener('click', () => { closeModal('listSavedNav'); showScreen('list'); /* Placeholder */ console.log("Ir a Ver Campaña de Mora Express"); });


        showScreen('list'); updateSegmentActionButtonsState();
        document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], textarea, select').forEach(el => { let baseClasses = ['mt-1', 'block', 'w-full', 'border', 'rounded-md', 'shadow-sm', 'focus:outline-none', 'focus:ring-[#29ABE2]', 'focus:border-[#29ABE2]']; let specificClasses = []; if (el.classList.contains('input-filter')) specificClasses = ['px-3', 'py-2', 'bg-[#f3f3f3]', 'border-[#c5c5c5]', 'sm:text-sm']; else if (el.closest('.activity-card-body')) specificClasses = ['px-3', 'py-2', 'bg-[#ffffff]', 'border-[#c5c5c5]', 'sm:text-sm']; else specificClasses = ['px-3', 'py-2', 'bg-[#f3f3f3]', 'border-[#c5c5c5]', 'sm:text-sm']; el.classList.add(...baseClasses, ...specificClasses); if (el.tagName === 'SELECT' && el.multiple) el.classList.add('h-auto'); });
        document.querySelectorAll('.input-form-styles').forEach(el => el.classList.add('px-3', 'py-2', 'bg-[#f3f3f3]', 'border', 'border-[#c5c5c5]', 'rounded-md', 'shadow-sm', 'focus:outline-none', 'focus:ring-[#29ABE2]', 'focus:border-[#29ABE2]', 'sm:text-sm', 'w-full'));
    });