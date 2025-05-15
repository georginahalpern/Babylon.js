import * as React from "react";

/**
 * Because our shared components are used in the context of our tools which have varifying UX capabilities and keyboard interactions, it's important for our UX components which respond to events to stop propagation so that the interaction is only registered by the current UX component and not others who have similar handlers.
 * This is covered by lockObject mechanism in V1 world however using stop propagation will allow us to remove that notion from within the shared components
 *
 */
export interface WithStopPropagationProps {
    onChange?: (event: React.ChangeEvent<any>, data: any) => void;
    onKeyDown?: (event: React.KeyboardEvent<any>) => void;
}

export const withStopPropagationOnChange = (Component: React.ComponentType<WithStopPropagationProps>) => {
    return (props: WithStopPropagationProps) => {
        // Wrapping the existing onChange handler
        const handleChange = (event: React.ChangeEvent<HTMLInputElement>, data: any) => {
            event.stopPropagation(); // Prevent event propagation
            if (props.onChange) {
                props.onChange(event, data); // Call the original onChange handler passed as prop
            }
        };

        const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
            event.stopPropagation(); // Prevent event propagation
            if (props.onKeyDown) {
                props.onKeyDown(event); // Call the original onKeyDown handler passed as prop
            }
        };

        // Return the wrapped component with modified onChange handler
        return <Component {...props} onChange={handleChange} onKeyDown={handleKeyDown} />;
    };
};

// Come back to this later
// const stoppedInput = withStopPropagationOnChange(StyledInput);
// const stoppedText = withStopPropagationOnChange(StyledTextarea);
