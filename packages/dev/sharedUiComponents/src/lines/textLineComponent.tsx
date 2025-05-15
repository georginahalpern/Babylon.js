import * as React from "react";
import { copyCommandToClipboard } from "../copyCommandToClipboard";
import { Link, Text } from "@fluentui/react-components";
import { PropertyLineStyled } from "shared-ui-components/fluent/styledWrappers";
interface ITextLineComponentProps {
    label?: string;
    value?: string;
    color?: string;
    underline?: boolean;
    onLink?: () => void;
    url?: string;
    ignoreValue?: boolean;
    additionalClass?: string;
    icon?: string;
    iconLabel?: string;
    tooltip?: string;
    onCopy?: true | (() => string);
}

export class TextLineComponent extends React.Component<ITextLineComponentProps> {
    constructor(props: ITextLineComponentProps) {
        super(props);
    }

    onLink() {
        if (this.props.url) {
            window.open(this.props.url, "_blank");
            return;
        }
        if (!this.props.onLink) {
            return;
        }

        this.props.onLink();
    }

    renderContent() {
        if (this.props.ignoreValue) {
            return null;
        }

        if (this.props.onLink || this.props.url) {
            return (
                <Link title={this.props.tooltip ?? this.props.label ?? ""} onClick={() => this.onLink()}>
                    {this.props.url ? "doc" : this.props.value || "no name"}
                </Link>
            );
        }
        return (
            <Text title={this.props.tooltip ?? this.props.label ?? ""} style={{ color: this.props.color ? this.props.color : "" }}>
                {this.props.value || "no name"}
            </Text>
        );
    }

    override render() {
        return (
            // Figure this out
            // <div className={MergeClassNames(["textLine", ["underline", this.props.underline], this.props.additionalClass, ["icon", this.props.onCopy]])}>
            //     {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
            <PropertyLineStyled
                label={this.props.label ?? ""}
                icon={this.props.icon}
                iconLabel={this.props.iconLabel}
                onCopy={
                    this.props.onCopy &&
                    (() => {
                        const onCopy = this.props.onCopy;
                        if (onCopy === true && this.props.value !== undefined) {
                            copyCommandToClipboard(this.props.value);
                        } else if (typeof onCopy === "function") {
                            copyCommandToClipboard(onCopy());
                        }
                    })
                }
            >
                {this.renderContent()}
            </PropertyLineStyled>
        );
    }
}
