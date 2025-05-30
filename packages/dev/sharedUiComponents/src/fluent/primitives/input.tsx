import { Input as FluentInput, InputProps, makeStyles } from "@fluentui/react-components";

const useInputStyles = makeStyles({
    text: {
        height: "auto",
    },
    float: {
        height: "auto",
        // width: "30px",
        width: "80px", // Fixed width for number input
        flexShrink: 0,
    },
});

/**
 * This is an input text box that stops propagation of change events and sets its width based on the type of input (text or number)
 * @param props
 * @returns
 */
export const Input: React.FC<InputProps> = (props: InputProps) => {
    const styles = useInputStyles();
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

    return <FluentInput {...props} className={props.type === "number" ? styles.float : styles.text} onChange={handleChange} onKeyDown={handleKeyDown} />;
};
