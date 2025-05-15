import { Accordion, AccordionItem, AccordionHeader, AccordionPanel, Label, Dropdown, Option } from "@fluentui/react-components";

import * as React from "react";
import { useGlobalStyles } from "./globalStyles";
import { IInspectableOptions } from "core/Misc";

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

// interface AccordionItemProps {
//     children: React.ReactNode;
//     value: string;
//     title: string;
// }

// export const AccordionItemStyled: React.FC<AccordionItemProps> = (props: AccordionItemProps) => {
//     const styles = useGlobalStyles();
//     return (
//         <AccordionItem className={styles.accordionItem} value={props.value}>
//             <AccordionHeader className={styles.accordionHeader}>{props.title}</AccordionHeader>
//             <AccordionPanel className={styles.accordionPanel}>{props.children}</AccordionPanel>
//         </AccordionItem>
//     );
// };

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

export const PropertyLineStyled: React.FC<{ children: React.ReactNode } & { label: string }> = (props: { children: React.ReactNode } & { label: string }) => {
    const styles = useGlobalStyles();
    return (
        <div className={styles.propertyLine}>
            <Label className={styles.label}>{props.label}</Label>
            <div className={styles.rightContent}>{props.children}</div>
        </div>
    );
};
// can add a propertylinestyled w copy button too

export const LineContainerComponent2 = (props: { children: React.ReactNode } & { value: string; title: string }) => {
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
