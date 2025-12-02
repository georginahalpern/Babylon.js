import { Subtitle2Stronger, makeStyles, tokens } from "@fluentui/react-components";
import type { FluentIcon } from "@fluentui/react-icons";
import type { FunctionComponent, PropsWithChildren } from "react";

const useStyles = makeStyles({
    rootDiv: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    icon: {
        height: "100%",
        padding: tokens.spacingHorizontalS,
    },
    header: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: "36px",
        backgroundColor: tokens.colorBackgroundOverlay,
        padding: tokens.spacingHorizontalS,
    },
    headerText: {
        marginLeft: tokens.spacingHorizontalM,
    },
});

export type PaneProps = {
    title: string;
    icon?: FluentIcon;
};
export const Pane: FunctionComponent<PropsWithChildren<PaneProps>> = (props) => {
    const classes = useStyles();
    return (
        <div className={classes.rootDiv}>
            <div className={classes.header}>
                {props.icon ? (
                    <props.icon className={classes.icon} />
                ) : (
                    <img className={classes.icon} id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                )}
                <Subtitle2Stronger id="title" className={classes.headerText}>
                    {props.title}
                </Subtitle2Stronger>
            </div>
            {props.children}
        </div>
    );
};
