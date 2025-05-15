import { Accordion, AccordionItem, AccordionHeader, AccordionPanel, Label } from "@fluentui/react-components";

import * as React from "react";
import { useGlobalStyles } from "./globalStyles";

interface AccordionProps {
    children: React.ReactNode;
}

export const AccordionStyled: React.FC<AccordionProps> = (props: AccordionProps) => {
    const styles = useGlobalStyles();
    return (
        <Accordion className={styles.accordionContainer} collapsible>
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

export const LineContainerComponent2 = (props: { children: React.ReactNode } & { value: string; title: string }) => {
    const styles = useGlobalStyles();
    return (
        <AccordionItem className={styles.accordionItem} value={props.value}>
            <AccordionHeader className={styles.accordionHeader}>{props.title}</AccordionHeader>
            <AccordionPanel className={styles.accordionPanel}>{props.children}</AccordionPanel>
        </AccordionItem>
    );
};
