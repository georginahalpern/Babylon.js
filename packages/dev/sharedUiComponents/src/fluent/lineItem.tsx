import * as React from "react";

type StackProps = {
    children: React.ReactNode;
    direction: React.CSSProperties["flexDirection"];
    spacing?: string;
};

export function Stack({ children, direction = "column", spacing = "8px" }: StackProps) {
    const childrenArray = React.Children.toArray(children);

    // Ensure there are only 2 or 3 children
    if (childrenArray.length !== 2 && childrenArray.length !== 3) {
        throw new Error("Stack component only accepts 2 or 3 children.");
    }

    // Styles based on the number of children
    let itemStyles: React.CSSProperties[];
    if (childrenArray.length === 2) {
        itemStyles = [
            { flex: "0 0 50%" }, // First item takes 50% width
            { flex: "1", textAlign: "right" }, // Second item takes the remaining space
        ];
    } else if (childrenArray.length === 3) {
        itemStyles = [
            { flex: "1" }, // First item takes equal width
            { flex: "1" }, // Second item takes equal width
            { flex: "1", textAlign: "right" }, // Third item takes equal width
        ];
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: direction,
                gap: spacing,
                // display: "grid",
                gridTemplateRows: "repeat(1fr)",
                justifyItems: "start",
                // gap: "2px",
                maxWidth: "400px",
            }}
            className={"listLine"}
        >
            {childrenArray.map((child, index) => (
                <div key={index} style={itemStyles[index]}>
                    {child}
                </div>
            ))}
        </div>
    );
}
