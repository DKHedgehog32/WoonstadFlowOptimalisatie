/**
 * =============================================
 * WoonstadFlowChoiceButtons.js
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Lightning Web Component for Flow Screen buttons 
 * that allow the user to choose between:
 *  - "Ik heb een aanvraag" (I have a request)
 *  - "Ik heb een vraag" (I have a question)
 * 
 * The component sets Flow variables accordingly 
 * and navigates to the next Flow screen.
 */

import { LightningElement, api } from 'lwc';
import { FlowNavigationNextEvent } from 'lightning/flowSupport';

export default class WoonstadFlowChoiceButtons extends LightningElement {
    /**
     * Flow variables exposed as @api so that 
     * they can be mapped inside the Flow builder.
     */
    @api var_aanvraag; // Boolean-like string: 'true' or 'false'
    @api var_vraag;    // Boolean-like string: 'true' or 'false'

    /**
     * Handler for "Ik heb een aanvraag".
     * Sets var_aanvraag = true and var_vraag = false,
     * then navigates to the next Flow screen.
     */
    handleAanvraagClick() {
        this.var_aanvraag = 'true';
        this.var_vraag = 'false';
        this.goNext();
    }

    /**
     * Handler for "Ik heb een vraag".
     * Sets var_aanvraag = false and var_vraag = true,
     * then navigates to the next Flow screen.
     */
    handleVraagClick() {
        this.var_aanvraag = 'false';
        this.var_vraag = 'true';
        this.goNext();
    }

    /**
     * Utility function to dispatch the Flow navigation event.
     */
    goNext() {
        this.dispatchEvent(new FlowNavigationNextEvent());
    }
}