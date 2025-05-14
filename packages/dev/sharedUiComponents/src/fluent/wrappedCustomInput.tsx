import { Input, InputOnChangeData, InputProps, makeStyles } from "@fluentui/react-components";
import * as React from "react";

interface WithStopPropagationProps {
    onChange?: (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

const withStopPropagationOnChange = <P extends WithStopPropagationProps>(Component: React.ComponentType<P>) => {
    return (props: P) => {
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

const useStyles = makeStyles({
    input: {
        color: "black",
        backgroundColor: "white",
        height: "auto",
        marginRight: "5px",
        width: "calc(100% - 5px)",
    },
});

const CustomInput: React.FC<InputProps> = (props: InputProps) => {
    const styles = useStyles();
    return <Input {...props} className={styles.input} onChange={props.onChange} onKeyDown={props.onKeyDown} />;
};

// Wrap CustomInput with the HOC
const WrappedCustomInput = withStopPropagationOnChange(CustomInput);

export default WrappedCustomInput;
