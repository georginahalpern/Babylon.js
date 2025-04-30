import { FluentProvider, Text, webDarkTheme } from "@fluentui/react-components";
import * as React from "react";

type LabeledLineProps = {
    label: string;
    children: React.ReactNode;
};

export const LabeledLine: React.FC<LabeledLineProps> = (props: LabeledLineProps) => {
    return (
        <FluentProvider theme={webDarkTheme}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <Text weight="semibold">{props.label}</Text>
                <div style={{ flex: 1 }}>{props.children}</div>
            </div>
        </FluentProvider>
    );
};
