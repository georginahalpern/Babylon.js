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
        gap: "24px",
        borderRadius: "16px",
        backgroundColor: "coral",
    },
    accordionContainer: {
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
        //justifyContent: "flex-start",
        // flexGrow: 1,
        // gap: "8px",
        // flexWrap: "wrap",
        // overflow: "hidden",
        // whiteSpace: "nowrap",
        // textOverflow: "ellipsis",
        // fontWeight: 500,
        // fontSize: "14px",
        backgroundColor: "limegreen",
    },
    rightContent: {
        // flex: 1,
        // display: "flex",
        // justifyContent: "flex-end",
        // gap: tokens.gap,
        // flexGrow: 1,
        // alignItems: "center",
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
