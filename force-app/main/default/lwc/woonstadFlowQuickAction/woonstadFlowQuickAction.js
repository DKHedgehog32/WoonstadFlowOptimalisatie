/**
 * =============================================
 * WoonstadFlowQuickAction.js
 * =============================================
 * Date: 2025-08-06
 * Last Changed: 2025-08-06
 * Description:
 * Legacy Quick Action modal.
 * Modal controls size; Flow scales down to fit.
 */

import { LightningElement, api } from 'lwc';

export default class WoonstadFlowQuickAction extends LightningElement {
    @api recordId;
    headerTitle = 'Nieuwe Zaak';

    renderedCallback() {
        this.autoScaleFlow();
    }

    get flowInputs() {
        return this.recordId
            ? [{ name: 'recordId', type: 'String', value: this.recordId }]
            : [];
    }

    handleStatusChange(event) {
        console.log('Flow status changed:', event.detail.status);

        if (event.detail.status === 'FINISHED' || event.detail.status === 'FINISHED_SCREEN') {
            this.dispatchEvent(new CustomEvent('close'));
        }
    }

    autoScaleFlow() {
        try {
            const modal = this.template.host.closest('.slds-modal__container');
            const flowWrapper = this.template.querySelector('.flow-container');
            if (modal && flowWrapper) {
                const modalHeight = modal.offsetHeight;
                const modalWidth = modal.offsetWidth;
                const contentHeight = flowWrapper.scrollHeight;
                const contentWidth = flowWrapper.scrollWidth;

                const heightScale = modalHeight / contentHeight;
                const widthScale = modalWidth / contentWidth;
                const scale = Math.min(heightScale, widthScale, 1); // prevent upscale

                flowWrapper.style.transform = `scale(${scale})`;
                flowWrapper.style.width = `${100 / scale}%`;
                flowWrapper.style.transformOrigin = 'top center';

                console.log(`Flow auto-scaled with factor: ${scale}`);
            }
        } catch (err) {
            console.warn('Auto-scale failed:', err);
        }
    }
}