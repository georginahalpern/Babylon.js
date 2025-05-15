// import * as React from "react";
// import { makeStyles, shorthands } from "@fluentui/react-components";
// import { tokens } from "./tokens";
// const useStyles = makeStyles({
//     itemContainer: {
//         display: "flex",
//         alignItems: "center",
//         height: tokens.lineHeight,
//         ...shorthands.padding(tokens.padding),
//         ...shorthands.borderBottom("1px", "solid", tokens.borderColor),
//     },
//     label: {
//         width: tokens.labelWidth,
//         overflow: "hidden",
//         whiteSpace: "nowrap",
//         textOverflow: "ellipsis",
//         fontWeight: 500,
//     },
//     rightContent: {
//         flex: 1,
//         display: "flex",
//         justifyContent: "flex-end",
//         gap: tokens.gap,
//     },
// });

// interface AccordionItemProps {
//     label: string;
//     children?: React.ReactNode;
// }

// export const AccordionItem: React.FC<AccordionItemProps> = ({ label, children }) => {
//     const styles = useStyles();

//     return (
//         <div className={styles.itemContainer}>
//             <div className={styles.label}>{label}</div>
//             <div className={styles.rightContent}>{children}</div>
//         </div>
//     );
// };
