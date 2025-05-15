import { Accordion, AccordionItem, AccordionHeader, AccordionPanel, Label, Dropdown, Option, Button, InputProps, Input, TextareaProps, Textarea } from "@fluentui/react-components";

import * as React from "react";
import { useGlobalStyles } from "./globalStyles";
import { IInspectableOptions } from "core/Misc";
import { Copy24Regular } from "@fluentui/react-icons";

export const StyledToolPanel = (props: { children: React.ReactNode } & { title: string }) => {
    const classes = useGlobalStyles();
    return (
        <div className={classes.toolPanel}>
            <div className={classes.toolHeader}>
                <img className={classes.logo} src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                {props.title}
            </div>
            {props.children}
        </div>
    );
};

export const StyledPreviewPanel = (props: { children: React.ReactNode }) => {
    const classes = useGlobalStyles();
    return <div className={classes.previewPanel}>{props.children}</div>;
};

export const AccordionStyled: React.FC<{
    children: React.ReactNode;
}> = (props: { children: React.ReactNode }) => {
    const styles = useGlobalStyles();
    return (
        <Accordion className={styles.accordionContainer} collapsible multiple>
            {props.children}
        </Accordion>
    );
};

export const StyledInput: React.FC<InputProps> = (props) => {
    const styles = useGlobalStyles();
    return <Input {...props} className={styles.floatLineInput} />;
};
export const StyledTextarea: React.FC<TextareaProps> = (props) => {
    const styles = useGlobalStyles();
    return <Textarea {...props} className={styles.input} />;
};

// export const ControlledAccordion = () => {
//     const [openItems, setOpenItems] = React.useState(["1"]);
//     const handleToggle: AccordionToggleEventHandler<string> = (event, data) => {
//         setOpenItems(data.openItems);
//     };
//     return (
//         <Accordion openItems={openItems} onToggle={handleToggle} multiple collapsible>
//             <AccordionItem value="1">
//                 <AccordionHeader>Accordion Header 1</AccordionHeader>
//                 <AccordionPanel>
//                     <div>Accordion Panel 1</div>
//                 </AccordionPanel>
//             </AccordionItem>
//             <AccordionItem value="2">
//                 <AccordionHeader>Accordion Header 2</AccordionHeader>
//                 <AccordionPanel>
//                     <div>Accordion Panel 2</div>
//                 </AccordionPanel>
//             </AccordionItem>
//             <AccordionItem value="3">
//                 <AccordionHeader>Accordion Header 3</AccordionHeader>
//                 <AccordionPanel>
//                     <div>Accordion Panel 3</div>
//                 </AccordionPanel>
//             </AccordionItem>
//         </Accordion>
//     );
// };

export interface IPropertyLineStyledProps {
    children: React.ReactNode;
    label: string;
    icon?: string;
    iconLabel?: string; // Clean this up
    onCopy?: () => void;
}
export const PropertyLineStyled: React.FC<IPropertyLineStyledProps> = (props: IPropertyLineStyledProps) => {
    const styles = useGlobalStyles();
    return (
        <div className={styles.propertyLine}>
            {
                // Test this, idk any components that use it today? And update styling
                props.icon && <img src={props.icon} title={props.iconLabel} alt={props.iconLabel} color="black" className="icon" />
            }
            <Label className={styles.label}>{props.label}</Label>
            <div className={styles.rightContent}>
                {props.children}
                {
                    // UPDATE styling of copy
                }
                {props.onCopy && <Button id="copyProperty" icon={<Copy24Regular />} onClick={() => props.onCopy && props.onCopy()} title="Copy to clipboard" />}
            </div>
        </div>
    );
};

export const AccordionItemStyled = (props: { children: React.ReactNode } & { value: string; title: string }) => {
    const styles = useGlobalStyles();
    return (
        <AccordionItem className={styles.accordionItem} value={props.value}>
            <AccordionHeader className={styles.accordionHeader}>{props.title}</AccordionHeader>
            <AccordionPanel className={styles.accordionPanel}>{props.children}</AccordionPanel>
        </AccordionItem>
    );
};

export const DropdownStyled = (props: { options: IInspectableOptions[]; onSelect: (o: string) => void; defaultValue: string | number }) => {
    const styles = useGlobalStyles();
    return (
        <Dropdown
            className={styles.dropdownOption}
            onOptionSelect={(evt, data) => {
                data.optionValue != undefined && props.onSelect(data.optionValue);
            }}
            defaultValue={props.options.find((o) => o.value === props.defaultValue)?.label}
            defaultSelectedOptions={[props.defaultValue.toString()]}
        >
            {props.options.map((option: IInspectableOptions, i: number) => (
                <Option className={styles.optionsLine} key={option.label + i} value={option.value.toString()} disabled={false}>
                    {option.label}
                </Option>
            ))}
        </Dropdown>
    );
};
