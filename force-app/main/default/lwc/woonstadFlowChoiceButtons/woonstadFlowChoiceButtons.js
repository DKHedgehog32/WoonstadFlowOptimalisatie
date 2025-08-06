/**
 * =============================================
 * Woonstad Flow Choice Buttons Controller
 * =============================================
 * Date: 2025-08-05
 * Last Changed: 2025-08-05
 * Description:
 * Supports two Flow choice cards:
 * - "Naamplaatje aanvragen"
 * - "Informatie vraag"
 * Layout can be horizontal or vertical, configured in Flow.
 */

import { LightningElement, api } from 'lwc';
import { FlowNavigationNextEvent } from 'lightning/flowSupport';
import ICON_VRAAG from '@salesforce/resourceUrl/WSRinfo';
import ICON_AANVRAAG from '@salesforce/resourceUrl/WSRcard';

export default class WoonstadFlowChoiceButtons extends LightningElement {
    @api var_aanvraag;
    @api var_vraag;
    @api layout = 'horizontal';

    iconVraag = ICON_VRAAG;
    iconAanvraag = ICON_AANVRAAG;

    renderedCallback() {
        // Ensure equal width for all cards
        const cards = this.template.querySelectorAll('.choice-card');
        if (cards.length === 0) return;

        let maxWidth = 0;
        cards.forEach(card => {
            card.style.width = 'auto'; // reset first for recalculation
            const width = card.offsetWidth;
            if (width > maxWidth) {
                maxWidth = width;
            }
        });

        cards.forEach(card => {
            card.style.width = `${maxWidth}px`;
        });
    }

    get cardLayout() {
        return this.layout === 'vertical'
            ? 'card-content vertical'
            : 'card-content horizontal';
    }

    handleAanvraagClick() {
        this.var_aanvraag = 'true';
        this.var_vraag = 'false';
        this.dispatchEvent(new FlowNavigationNextEvent());
    }

    handleVraagClick() {
        this.var_aanvraag = 'false';
        this.var_vraag = 'true';
        this.dispatchEvent(new FlowNavigationNextEvent());
    }
}