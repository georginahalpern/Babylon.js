import { makeStyles } from "@fluentui/react-components";
import { tokens } from "./tokens";

/**
 * Note that I'm just keeping in globalStyles for now for ease of development. Once the styling is sorted,
 * I can move the component-specific styles to their respective components and keep this for truly global classes
 */
export const useGlobalStyles = makeStyles({
    app: {
        //  backgroundColor: "white",
    },
    container: {
        height: "100%",
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
        //backgroundColor: "turquoise",
        overflowY: "auto",
        // display: "grid",
        //gridTemplateRows: "1fr 5fr",
    },
    previewPanel: {
        display: "grid", //makes this a grid container, enables grid layout of direct children
        gridTemplateRows: "40px 1fr 40px", // The first row is 40px tall
        // The second row takes up all remaining available space (1fr means "one fraction of the available space").
        // The third row is 40px tall.
    },
    toolHeader: {
        // backgroundColor: "teal",
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
        gap: "5px", // gap between children
        // backgroundColor: "aquamarine",
    },
    accordionItem: {
        width: "-webkit-fill-available",
        padding: "2px",
        borderRadius: "8px",
        borderBlockColor: "white",
        gap: "2px",
        //backgroundColor: "indigo",
    },
    accordionHeader: {
        width: "-webkit-fill-available",
        fontSize: "20px",
        fontWeight: "20px",
        //backgroundColor: "hotpink",
    },
    accordionPanel: {
        padding: "1px",
        //backgroundColor: "pink",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        rowGap: "10px",
        overflow: "hidden",
    },
    propertyLine: {
        width: "-webkit-fill-available",
        display: "flex",
        height: "auto",
        flexDirection: "row",
        // textAlign: "right",
        gap: tokens.gap,
        alignItems: "center",
        //backgroundColor: "purple",
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
    buttonLine: {
        //  backgroundColor: "olive",
    },
    label: {
        width: "33%",
        textAlign: "left",
        // backgroundColor: "limegreen",
    },
    rightContent: {
        width: "67%",
        //backgroundColor: "red",
    },
    input: {
        height: "auto",
        marginRight: "5px",
        width: "100%",
    },
    floatLineInput: {
        width: "33%",
    },
});
