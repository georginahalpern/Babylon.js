import { Button, InfoLabel, makeStyles, tokens } from "@fluentui/react-components";
import { Add24Filled, Copy24Regular, Subtract24Filled } from "@fluentui/react-icons";
import * as React from "react";

const usePropertyLineStyle = makeStyles({
    container: {
        width: "100%",
        display: "flex",
        flexDirection: "column", // Stack line + expanded content
        borderBottom: "1px solid #eee",
    },
    line: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: `${tokens.spacingVerticalM} 0px`,
        width: "100%",
    },
    label: {
        width: "33%",
        textAlign: "left",
        fontWeight: "bold",
    },
    rightContent: {
        width: "67%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
    },
    button: {
        width: "100px",
    },
    fillRestOfRightContentWidth: {
        flex: 1,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        marginRight: "10px",
    },
    expandedContent: {
        padding: "8px 12px",
        backgroundColor: "#f9f9f9",
    },
});

export interface IPropertyLineProps {
    children: React.ReactNode;
    label: string;
    description?: string;
    icon?: string;
    iconLabel?: string;
    onCopy?: () => void;
    renderExpandedContent?: () => React.ReactNode;
}

export const PropertyLine: React.FC<IPropertyLineProps> = (props: IPropertyLineProps) => {
    const styles = usePropertyLineStyle();
    const [expanded, setExpanded] = React.useState(false);

    return (
        <div className={styles.container}>
            <div className={styles.line}>
                <InfoLabel className={styles.label} info={props.description}>
                    {props.label}
                </InfoLabel>
                <div className={styles.rightContent}>
                    <div className={styles.fillRestOfRightContentWidth}>{props.children}</div>

                    {props.renderExpandedContent && (
                        <Button
                            appearance="subtle"
                            icon={expanded ? <Subtract24Filled /> : <Add24Filled />}
                            className={styles.button}
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }}
                        />
                    )}

                    {props.onCopy && <Button className={styles.button} id="copyProperty" icon={<Copy24Regular />} onClick={() => props.onCopy?.()} title="Copy to clipboard" />}
                </div>
            </div>

            {expanded && props.renderExpandedContent && <div className={styles.expandedContent}>{props.renderExpandedContent()}</div>}
        </div>
    );
};
