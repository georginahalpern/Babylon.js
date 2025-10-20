import { Toolbar as FluentToolbar, makeStyles, tokens } from "@fluentui/react-components";
import type { FunctionComponent, PropsWithChildren } from "react";

const useToolbarStyles = makeStyles({
    toolbar: {
        backgroundColor: "#292A4A",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: tokens.spacingHorizontalS,
        gap: tokens.spacingHorizontalS,
    },
});

/**
 * This is a toolbar component
 * @param props
 * @returns
 */
export const Toolbar: FunctionComponent<PropsWithChildren<{ id: string }>> = (props) => {
    Toolbar.displayName = "Toolbar";

    const classes = useToolbarStyles();

    return <FluentToolbar className={classes.toolbar} {...props} />;
};
