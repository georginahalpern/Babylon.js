import { FluentProvider, Theme, webDarkTheme } from "@fluentui/react-components";
import { useGlobalStyles } from "./globalStyles";

export interface IStyledToolHostProps {
    children: React.ReactNode;
    customTheme?: Theme;
}
export const StyledToolHost: React.FC<IStyledToolHostProps> = (props: IStyledToolHostProps) => {
    const styles = useGlobalStyles();
    const theme = props.customTheme || webDarkTheme;
    return (
        <FluentProvider theme={theme}>
            <div className={styles.app}>{props.children}</div>
        </FluentProvider>
    );
};
