import * as React from "react";

// Generalized HOC to stop propagation on multiple event types
// const withStopPropagation = <P extends { [key: string]: (...args: any[]) => void }>(Component: React.ComponentType<P>) => {
//     return (props: P) => {
//         // A function to handle event propagation
//         const handleEvent = <E extends React.SyntheticEvent>(event: E, handler?: (...args: any[]) => void) => {
//             event.stopPropagation(); // Prevent event propagation
//             if (handler) {
//                 handler(event); // Call the original event handler passed as prop
//             }
//         };

//         // Create modified props by attaching the stop propagation logic to event handlers
//         const modifiedProps = Object.keys(props).reduce((acc, key) => {
//             const prop = props[key as keyof P];

//             if (key.startsWith("on") && typeof prop === "function") {
//                 // If it's an event handler, modify it
//                 acc[key as keyof P] = ((event: React.SyntheticEvent) => handleEvent(event, prop)) as any; // Cast to `any` to match the event handler signature
//             } else {
//                 // Otherwise, just pass the prop through
//                 acc[key as keyof P] = prop;
//             }
//             return acc;
//         }, {} as P);

//         return <Component {...modifiedProps} />;
//     };
// };

import { Button, ButtonProps, Input, InputProps, Textarea } from "@fluentui/react-components"; // Fluent UI component types

// // Define the valid Fluent UI component types for our HOC
// type FluentUIComponentProps = ButtonProps | InputProps; // Add more Fluent UI component props as needed

// // Generalized HOC to stop propagation on multiple event types, only for Fluent UI components
// const withStopPropagation = <P extends FluentUIComponentProps>(Component: React.ComponentType<P>) => {
//     return (props: P) => {
//         // A function to handle event propagation
//         const handleEvent = <E extends React.SyntheticEvent>(event: E, handler?: (...args: any[]) => void) => {
//             event.stopPropagation(); // Prevent event propagation
//             if (handler && typeof handler === "function") {
//                 handler(event); // Call the original event handler passed as prop
//             }
//         };

//         // Create modified props by attaching the stop propagation logic to event handlers
//         const modifiedProps = Object.keys(props).reduce((acc, key) => {
//             const prop = props[key as keyof P];

//             if (key.startsWith("on") && typeof prop === "function") {
//                 // If it's an event handler, modify it
//                 acc[key as keyof P] = ((event: React.SyntheticEvent) => handleEvent(event, prop)) as any; // Cast to `any` to match the event handler signature
//             } else {
//                 // Otherwise, just pass the prop through
//                 acc[key as keyof P] = prop;
//             }
//             return acc;
//         }, {} as P);

//         return <Component {...modifiedProps} />;
//     };
// };

// export default withStopPropagation;

import { TextareaProps } from "@fluentui/react-components";

// Define a shared type for all the Fluent UI components you want to wrap
type FluentUIComponentProps = ButtonProps | InputProps | TextareaProps; // Add more Fluent UI component props as needed

// Generalized HOC to stop propagation on multiple event types for Fluent UI components
const withStopPropagation = <P extends FluentUIComponentProps>(Component: React.ComponentType<P>) => {
    return (props: P) => {
        // A function to handle event propagation
        const handleEvent = <E extends React.SyntheticEvent>(event: E, handler?: (...args: any[]) => void) => {
            event.stopPropagation(); // Prevent event propagation
            if (typeof handler === "function") {
                handler(event); // Call the original event handler passed as prop
            }
        };

        // Create modified props by attaching the stop propagation logic to event handlers
        const modifiedProps = Object.keys(props).reduce((acc, key) => {
            const prop = props[key as keyof P];

            if (key.startsWith("on") && typeof prop === "function") {
                // If it's an event handler, modify it
                acc[key as keyof P] = ((event: React.SyntheticEvent) => handleEvent(event, prop as any)) as any; // Cast to `any` to match the event handler signature
            } else {
                // Otherwise, just pass the prop through
                acc[key as keyof P] = prop;
            }
            return acc;
        }, {} as P);

        return <Component {...modifiedProps} />;
    };
};

export default withStopPropagation;

const WrappedButton = withStopPropagation(Button);
const WrappedInput = withStopPropagation(Input);
const WrappedTextarea = withStopPropagation(Textarea);

export { WrappedButton, WrappedInput, WrappedTextarea };
