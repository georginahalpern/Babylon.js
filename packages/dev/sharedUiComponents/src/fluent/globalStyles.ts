import { makeStyles } from "@fluentui/react-components";
import { tokens } from "./tokens";

export const useGlobalStyles = makeStyles({
    app: {
        backgroundColor: "white",
    },
    container: {
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        borderRadius: "16px",
        backgroundColor: "coral",
    },
    logo: {
        width: "32px", // update all of these things to be tokens
        height: "32px",
    },
    toolPanel: {
        backgroundColor: "turquoise",
        overflowY: "auto",
        height: "75%",
    },
    toolHeader: {
        backgroundColor: "teal",
        fontSize: "20px",
        fontWeight: "bold",
        textAlign: "center",
    },
    accordionContainer: {
        overflowY: "auto",
        height: "100%",
        width: "-webkit-fill-available",
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        backgroundColor: "aquamarine",
    },
    accordionItem: {
        width: "-webkit-fill-available",
        padding: "2px",
        borderRadius: "8px",
        backgroundColor: "indigo",
    },
    accordionHeader: {
        width: "-webkit-fill-available",
        fontSize: "20px",
        fontWeight: "20px",
        backgroundColor: "hotpink",
    },
    accordionPanel: {
        padding: "1px",
        backgroundColor: "pink",
        borderRadius: "8px",
    },
    propertyLine: {
        width: "-webkit-fill-available",
        display: "flex",
        height: "auto",
        flexDirection: "row",
        textAlign: "right",
        gap: tokens.gap,
        alignItems: "center",
        backgroundColor: "purple",
        padding: "5px",
        borderRadius: "7px",
        margin: "2px",
    },
    dropdownOption: {
        textAlign: "right",
        minWidth: "40px",
    },
    optionsLine: {
        // why do i ned this
    },
    indicator: {
        marginRight: 0,
    },
    buttonLine: {
        backgroundColor: "olive",
    },
    label: {
        width: "33%",
        textAlign: "left",
        backgroundColor: "limegreen",
    },
    rightContent: {
        width: "67%",
        backgroundColor: "red",
    },
    input: {
        color: "black",
        backgroundColor: "white",
        height: "auto",
        marginRight: "5px",
        width: "calc(100% - 5px)",
    },
});
