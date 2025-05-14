import * as React from "react";
import { copyCommandToClipboard } from "../copyCommandToClipboard";
// import { MergeClassNames } from "../styleHelper";
import { Button, Link, Text } from "@fluentui/react-components";
import { Copy24Regular } from "@fluentui/react-icons";
import { Stack } from "shared-ui-components/fluent/lineItem";
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
            // <div className={MergeClassNames(["textLine", ["underline", this.props.underline], this.props.additionalClass, ["icon", this.props.onCopy]])}>
            //     {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
            <Stack direction="row">
                <div className="label" title={this.props.tooltip ?? this.props.label ?? ""}>
                    {this.props.label ?? ""}
                </div>

                {this.renderContent()}
                {this.props.onCopy && (
                    <Button
                        icon={<Copy24Regular />}
                        onClick={() => {
                            const onCopy = this.props.onCopy;
                            if (onCopy === true && this.props.value !== undefined) {
                                copyCommandToClipboard(this.props.value);
                            } else if (typeof onCopy === "function") {
                                copyCommandToClipboard(onCopy());
                            }
                        }}
                        title="Copy to clipboard"
                    />

                    // <div
                    //     className="copy hoverIcon"
                    //     onClick={() => {
                    //         const onCopy = this.props.onCopy;
                    //         if (onCopy === true && this.props.value !== undefined) {
                    //             copyCommandToClipboard(this.props.value);
                    //         } else if (typeof onCopy === "function") {
                    //             copyCommandToClipboard(onCopy());
                    //         }
                    //     }}
                    //     title="Copy to clipboard"
                    // >
                    //     <img src={copyIcon} alt="Copy" />
                    // </div>
                )}
            </Stack>
            // </div>
        );
    }
}
