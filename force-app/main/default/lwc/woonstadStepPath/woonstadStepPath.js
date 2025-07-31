/**
 * =============================================
 * WoonstadStepPath.js
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Custom Step Path (progress indicator) for Woonstad flows.
 * - Renders dynamic steps from a JSON input string.
 * - Highlights current step, shows completed steps with checkmark.
 * - Displays tooltips only for the active step.
 */

import { LightningElement, api } from 'lwc';

export default class WoonstadStepPath extends LightningElement {
    // Private variables for internal state
    _jsonInput;
    _stepsRaw = [];
    _currentStep = 0;

    // Public array used in the template to render steps
    steps = [];

    /**
     * API property: JSON string defining the steps.
     * Example: 
     * [
     *   { "number": 1, "label": "Start", "tooltip": "Eerste stap" },
     *   { "number": 2, "label": "Details", "tooltip": "Vul gegevens in" }
     * ]
     */
    @api
    set jsonInput(value) {
        this._jsonInput = value;
        this.parseJson(value);
    }
    get jsonInput() {
        return this._jsonInput;
    }

    /**
     * API property: Index of the current step (number).
     * Updates classes to reflect active/completed state.
     */
    @api
    set currentStep(value) {
        this._currentStep = Number(value);
        this.updateStepClasses();
    }
    get currentStep() {
        return this._currentStep;
    }

    /**
     * Parse the incoming JSON string into step objects.
     * If invalid JSON, resets the steps.
     */
    parseJson(value) {
        try {
            this._stepsRaw = JSON.parse(value);
            this.updateStepClasses();
        } catch (error) {
            console.error('Invalid JSON for step path:', error);
            this._stepsRaw = [];
            this.steps = [];
        }
    }

    /**
     * Updates each step’s classes and state based on currentStep.
     * - completed: step.number < currentStep
     * - active: step.number === currentStep
     * - inactive: otherwise
     */
    updateStepClasses() {
        if (!Array.isArray(this._stepsRaw)) {
            this.steps = [];
            return;
        }

        this.steps = this._stepsRaw.map(step => {
            const isCompleted = step.number < this._currentStep;
            const isActive = step.number === this._currentStep;

            return {
                ...step,
                circleClass: `step-circle ${isCompleted ? 'completed' : isActive ? 'active' : 'inactive'}`,
                labelClass: `step-label ${isActive ? 'active' : 'inactive'}`,
                isCompleted,
                isActive,
                displayValue: isCompleted ? '✓' : step.number,
                tooltip: step.tooltip || '',
                showTooltip: false
            };
        });
    }

    /**
     * Show tooltip for the hovered step,
     * but only if it’s the active step.
     */
    handleMouseOver(event) {
        const stepId = Number(event.currentTarget.dataset.id);
        this.steps = this.steps.map(step => ({
            ...step,
            showTooltip: step.number === stepId && step.number === this._currentStep
        }));
    }

    /**
     * Hide tooltip when mouse leaves the step.
     */
    handleMouseOut() {
        this.steps = this.steps.map(step => ({
            ...step,
            showTooltip: false
        }));
    }
}