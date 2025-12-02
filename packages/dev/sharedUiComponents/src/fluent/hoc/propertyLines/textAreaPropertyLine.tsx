import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";
import { Textarea } from "../../primitives/textarea";
import type { TextareaProps } from "../../primitives/textarea";
import { UniformWidthStyling } from "../../primitives/utils";
import { makeStyles } from "@fluentui/react-components";
/**
 * Wraps textarea in a property line
 * @param props - PropertyLineProps and TextProps
 * @returns property-line wrapped text
 */

const useStyles = makeStyles({
    uniform: {
        ...UniformWidthStyling,
    },
});
export const TextAreaPropertyLine: FunctionComponent<PropertyLineProps<string> & TextareaProps> = (props) => {
    TextAreaPropertyLine.displayName = "TextAreaPropertyLine";
    return (
        <PropertyLine {...props}>
            <Textarea {...props} className={useStyles().uniform} />
        </PropertyLine>
    );
};
