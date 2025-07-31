/**
 * =============================================
 * Woonstad Flow Navigation Buttons
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * This Lightning Web Component provides custom
 * navigation buttons (Back, Next, Reset, Bevestigen)
 * for use inside Salesforce Flows. It dispatches
 * standard Flow navigation events so the buttons
 * control the Flow's execution path.
 */

import { LightningElement, api } from 'lwc';
import { FlowNavigationNextEvent, FlowNavigationBackEvent, FlowNavigationFinishEvent } from 'lightning/flowSupport';

export default class WoonstadFlowNavigationButtons extends LightningElement {
    // Public properties used to control button visibility from Flow
    @api showBack = false;
    @api showNext = false;
    @api showReset = false;
    @api showBevestigen = false; 

    /**
     * Handles the Back button click.
     * Dispatches FlowNavigationBackEvent to move to the previous screen.
     */
    handleBack() {
        this.dispatchEvent(new FlowNavigationBackEvent());
    }

    /**
     * Handles the Next button click.
     * Dispatches FlowNavigationNextEvent to move to the next screen.
     */
    handleNext() {
        this.dispatchEvent(new FlowNavigationNextEvent());
    }

    /**
     * Handles the Reset button click.
     * Dispatches FlowNavigationFinishEvent to exit the Flow.
     * Can be repurposed if you want Reset to behave differently.
     */
    handleReset() {
        this.dispatchEvent(new FlowNavigationFinishEvent()); 
    }

    /**
     * Handles the Bevestigen (Confirm) button click.
     * Currently implemented to act like Next,
     * but can be customized later if confirmation requires
     * additional logic.
     */
    handleBevestigen() {
        this.dispatchEvent(new FlowNavigationNextEvent());
    }
}