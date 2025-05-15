import { Input, InputOnChangeData, InputProps, Textarea, TextareaProps } from "@fluentui/react-components";
import * as React from "react";
import { useGlobalStyles } from "./globalStyles";

// interface WithStopPropagationProps {
//     onChange?: (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void;
//     onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
// }

const withStopPropagationOnChange = (Component: React.ComponentType) => {
    return (props: any) => {
        // Wrapping the existing onChange handler
        const handleChange = (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
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

const CustomInput: React.FC<InputProps> = (props: InputProps) => {
    const styles = useGlobalStyles();
    return <Input {...props} className={styles.input} onChange={props.onChange} onKeyDown={props.onKeyDown} />;
};
const CustomText: React.FC<TextareaProps> = (props: TextareaProps) => {
    const styles = useGlobalStyles();
    return <Textarea {...props} className={styles.input} onChange={props.onChange} onKeyDown={props.onKeyDown} />;
};

// Wrap CustomInput with the HOC
const WrappedCustomInput = withStopPropagationOnChange(CustomInput);
const WrappedCustomText = withStopPropagationOnChange(CustomText);
// Can do more generic later
export { WrappedCustomInput, WrappedCustomText };
