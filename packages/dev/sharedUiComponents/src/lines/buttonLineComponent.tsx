import { Button } from "@fluentui/react-components";
import { FunctionComponent } from "react";
import { useGlobalStyles } from "shared-ui-components/fluent/globalStyles";

export interface IButtonLineComponentProps {
    label: string;
    onClick: () => void;
    icon?: string;
    iconLabel?: string;
    isDisabled?: boolean;
}

export const ButtonLineComponent: FunctionComponent<IButtonLineComponentProps> = (props: IButtonLineComponentProps) => {
    const styles = useGlobalStyles();

    return (
        <Button
            className={styles.propertyLine}
            appearance="primary"
            icon={props.icon && <img src={props.icon} title={props.iconLabel} alt={props.iconLabel} className="icon" />}
            onClick={props.onClick}
            title={props.label}
            disabled={props.isDisabled}
        >
            {props.label}
        </Button>
    );
};
