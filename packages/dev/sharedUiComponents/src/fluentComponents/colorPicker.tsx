/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import { AlphaSlider, makeStyles, Popover, PopoverSurface, PopoverTrigger } from "@fluentui/react-components";
import { ColorPicker, ColorSlider, ColorArea } from "@fluentui/react-components";
import type { ColorPickerProps } from "@fluentui/react-components";

// const useStyles = makeStyles({
//     example: {
//         width: "300px",
//         display: "flex",
//         flexDirection: "column",
//         gap: "100px",
//     },
//     previewColor: {
//         margin: "10px 0",
//         width: "50px",
//         height: "50px",
//         borderRadius: "4px",
//         border: "1px solid #ccc",
//         "@media (forced-colors: active)": {
//             forcedColorAdjust: "none",
//         },
//     },
//     row: {
//         display: "flex",
//         gap: "10px",
//     },
//     sliders: {
//         display: "flex",
//         flexDirection: "column",
//     },
// });

interface IFluentColorPickerProps {
    value: Color3 | Color4;
    linearHint?: boolean;
    onColorChanged: (color: Color3 | Color4) => void;
    icon?: string;
    iconLabel?: string;
    shouldPopRight?: boolean;
    // lockObject?: LockObject;
}

// export const ColorPickerPopup = (props: IFluentColorPickerProps) => {
//     const styles = useStyles();

//     const [color, setColor] = React.useState(props.value);

//     const handleChange: ColorPickerProps["onColorChange"] = (_, data) => {
//         let color: Color3 | Color4 = Color3.FromHSV(data.color.h, data.color.s, data.color.v);
//         if (props.value instanceof Color4) {
//             color = Color4.FromColor3(color, data.color.a ?? 1);
//         }
//         setColor(color);
//         props.onColorChanged(color);
//     };

//     const [popoverOpen, setPopoverOpen] = React.useState(false);

//     return (
//         <div className={styles.example}>
//             <Popover open={popoverOpen} trapFocus onOpenChange={(_, data) => setPopoverOpen(data.open)}>
//                 <PopoverTrigger disableButtonEnhancement>
//                     <div className={styles.previewColor} style={{ backgroundColor: color.toHexString() }} />
//                 </PopoverTrigger>

//                 <PopoverSurface>
//                     <ColorPicker color={rgbaToHsv(color)} onColorChange={handleChange}>
//                         <ColorArea inputX={{ "aria-label": "Saturation" }} inputY={{ "aria-label": "Brightness" }} />
//                         <div className={styles.row}>
//                             <div className={styles.sliders}>
//                                 <ColorSlider aria-label="Hue" />
//                                 <AlphaSlider aria-label="Alpha" />
//                             </div>
//                             <div
//                                 className={styles.previewColor}
//                                 style={{
//                                     backgroundColor: color.toHexString(),
//                                 }}
//                             />
//                         </div>
//                     </ColorPicker>
//                 </PopoverSurface>
//             </Popover>
//         </div>
//     );
// };

function rgbaToHsv(color: { r: number; g: number; b: number; a?: number }): { h: number; s: number; v: number; a?: number } {
    const c = new Color3(color.r, color.g, color.b);
    const hsv = c.toHSV();
    return { h: hsv.r, s: hsv.g, v: hsv.b, a: color.a };
}

import { Input, type InputProps, Label, SpinButton, type SpinButtonChangeEvent, type SpinButtonOnChangeData, type SpinButtonProps, useId } from "@fluentui/react-components";
import { Color3, Color4 } from "core/Maths";

const useStyles = makeStyles({
    example: {
        width: "300px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    previewColor: {
        width: "50px",
        height: "50px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        "@media (forced-colors: active)": {
            forcedColorAdjust: "none",
        },
    },
    inputFields: {
        display: "flex",
        alignItems: "flex-end",
        flexDirection: "row",
        gap: "10px",
    },
    colorFieldWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    input: {
        width: "80px",
    },
    spinButton: {
        minWidth: "60px",
    },
});

const HEX_COLOR_REGEX = /^#?([0-9A-Fa-f]{0,6})$/;
const NUMBER_REGEX = /^\d+$/;
// const DEFAULT_COLOR_HSV = { h: 109, s: 1, v: 0.9, a: 1 };

type RgbKey = "r" | "g" | "b";
type HsvKey = "h" | "s" | "v";

// export const FluentColorPickerPopup = (props: IFluentColorPickerProps) => {
//     const styles = useStyles();

//     const [color, setColor] = React.useState(props.value);

//     const handleChange: ColorPickerProps["onColorChange"] = (_, data) => {
//         let color: Color3 | Color4 = Color3.FromHSV(data.color.h, data.color.s, data.color.v);
//         if (props.value instanceof Color4) {
//             color = Color4.FromColor3(color, data.color.a ?? 1);
//         }
//         setColor(color);
//         props.onColorChanged(color);
//     };

//     const [popoverOpen, setPopoverOpen] = React.useState(false);

//     return (
//         <div className={styles.example}>
//             <Popover open={popoverOpen} trapFocus onOpenChange={(_, data) => setPopoverOpen(data.open)}>
//                 <PopoverTrigger disableButtonEnhancement>
//                     <div className={styles.previewColor} style={{ backgroundColor: color.toHexString() }} />
//                 </PopoverTrigger>

//                 <PopoverSurface>
//                     <ColorPicker color={rgbaToHsv(color)} onColorChange={handleChange}>
//                         <ColorArea inputX={{ "aria-label": "Saturation" }} inputY={{ "aria-label": "Brightness" }} />
//                         <div className={styles.row}>
//                             <div className={styles.sliders}>
//                                 <ColorSlider aria-label="Hue" />
//                                 <AlphaSlider aria-label="Alpha" />
//                             </div>
//                             <div
//                                 className={styles.previewColor}
//                                 style={{
//                                     backgroundColor: color.toHexString(),
//                                 }}
//                             />
//                         </div>
//                     </ColorPicker>
//                 </PopoverSurface>
//             </Popover>
//         </div>
//     );
// };

export const ColorPickerPopup = (props: IFluentColorPickerProps) => {
    const hexId = useId("hex-input");
    const alphaId = useId("alpha-input");

    const styles = useStyles();
    const [color, setColor] = React.useState(props.value);

    const [popoverOpen, setPopoverOpen] = React.useState(false);

    React.useEffect(() => {
        //setHex(color.toHexString());
        //setAlpha(color instanceof Color4 ? color.a : 1);
        props.onColorChanged(color);
    }, [color]);

    const handleChange: ColorPickerProps["onColorChange"] = (_, data) => {
        let color: Color3 | Color4 = Color3.FromHSV(data.color.h, data.color.s, data.color.v);
        if (props.value instanceof Color4) {
            color = Color4.FromColor3(color, data.color.a ?? 1);
        }
        setColor(color);
    };

    const onRgbChange: InputRgbFieldProps["onChange"] = (_, data) => {
        if (data.value) {
            const newColor = color.clone();
            newColor[data.rgbKey] = data.value;
            setColor(newColor);
        }
    };

    const onHsvChange: InputHsvFieldProps["onChange"] = (_, data) => {
        if (data.value) {
            // Convert current color to HSV, update the new hsv value, then update state
            const hsv = rgbaToHsv(color);
            hsv[data.hsvKey] = data.value;
            let newColor: Color3 | Color4 = Color3.FromHSV(hsv.h, hsv.s, hsv.v);
            if (color instanceof Color4) {
                newColor = Color4.FromColor3(newColor, color.a ?? 1);
            }
            setColor(newColor);
        }
    };

    const onAlphaChange = React.useCallback(
        (_ev: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
            const value = data.value ?? parseFloat(data.displayValue ?? "");

            if (Number.isNaN(value) || value < 0 || value > 1) {
                return;
            }

            let newColor = color;
            if (props.value instanceof Color4) {
                newColor = Color4.FromColor3(color, value ?? 1);
            }
            setColor(newColor);
        },
        [setColor, color]
    );

    const colorAriaAttributes = {
        "aria-roledescription": "2D slider",
        //"aria-valuetext": `Saturation ${color.s * 100}, Brightness: ${color.v * 100}, ${namedColor}`,
    };

    return (
        <div className={styles.example}>
            <Popover open={popoverOpen} trapFocus onOpenChange={(_, data) => setPopoverOpen(data.open)}>
                <PopoverTrigger disableButtonEnhancement>
                    <div className={styles.previewColor} style={{ backgroundColor: color.toHexString() }} />
                </PopoverTrigger>

                <PopoverSurface>
                    {props.linearHint && (
                        <div>
                            Note: This color picker is attached to a material whose color is stored in linear space (ex: PBR Material), and Babylon converts the color to gamma
                            space before rendering on screen because the human eye is best at processing colors in gamma space. We thus also want to display the color picker in
                            gamma space so that the color chosen here will match the color seen in your material. If you want to copy/paste the HEX into your code, you can either
                            use Color3.FromHexString(LINEAR_HEX) or Color3.FromHexString(GAMMA_HEX).toLinearSpace() Both will send the linear value to the PBR material, and the
                            conversion to gamma will occur within Babylon engine.
                        </div>
                    )}
                    <ColorPicker color={rgbaToHsv(color)} onColorChange={handleChange}>
                        <ColorArea inputX={{ "aria-label": "Saturation", ...colorAriaAttributes }} inputY={{ "aria-label": "Brightness", ...colorAriaAttributes }} />

                        <ColorSlider
                            aria-label="Hue" // aria-valuetext={`${color.h}°, ${namedColor}`}
                        />
                        <AlphaSlider
                            disabled={color instanceof Color3}
                            aria-label="Alpha"
                            //aria-valuetext={`${color.a * 100}%`}
                        />
                    </ColorPicker>
                    <div className={styles.inputFields}>
                        <InputHexField
                            id={hexId}
                            label={"Gamma Hex"}
                            color={color}
                            onChange={(e) => {
                                const value = e.target.value;
                                HEX_COLOR_REGEX.test(value) && setColor(Color3.FromHexString(value));
                                // setHex((oldValue) => (HEX_COLOR_REGEX.test(value) ? value : oldValue));
                            }}
                        />

                        <InputHexField
                            id={hexId}
                            label={"Linear Hex"}
                            disabled={!props.linearHint}
                            isLinear={true}
                            color={color}
                            onChange={(e) => {
                                // If linearHint (aka PBR material, ensure the other values are displayed in gamma even if linear hex changes)
                                const value = e.target.value;
                                HEX_COLOR_REGEX.test(value) && setColor(Color3.FromHexString(value).toGammaSpace());
                                // setHex((oldValue) => (HEX_COLOR_REGEX.test(value) ? value : oldValue));
                            }}
                        />

                        <InputRgbField label="Red" color={color} rgbKey="r" onChange={onRgbChange} />
                        <InputRgbField label="Green" color={color} rgbKey="g" onChange={onRgbChange} />
                        <InputRgbField label="Blue" color={color} rgbKey="b" onChange={onRgbChange} />
                        <InputAlphaField id={alphaId} color={color} onChange={onAlphaChange} />

                        <InputHsvField label="Hue" color={color} hsvKey="h" max={360} onChange={onHsvChange} />
                        <InputHsvField label="Saturation" color={color} hsvKey="s" max={100} scale={100} onChange={onHsvChange} />
                        <InputHsvField label="Value" color={color} hsvKey="v" max={100} scale={100} onChange={onHsvChange} />
                    </div>
                    <div className={styles.previewColor} style={{ backgroundColor: color.toHexString() }} />
                </PopoverSurface>
            </Popover>
        </div>
    );
};

interface InputHexProps {
    label?: string;
    id: string;
    color: Color3 | Color4;
    onChange: InputProps["onChange"];
    isLinear?: boolean;
    disabled?: boolean;
}
const InputHexField = ({ label = "Hex", id, color, onChange, isLinear = false, disabled = false }: InputHexProps) => {
    const styles = useStyles();
    return (
        <div className={styles.colorFieldWrapper}>
            <Label htmlFor={id}>{label}</Label>
            <Input
                disabled={disabled}
                className={styles.input}
                value={isLinear ? color.toLinearSpace().toHexString() : color.toHexString()}
                id={id}
                onChange={onChange}
                //onBlur={handleOnBlur}
            />
        </div>
    );
};

interface InputRgbFieldProps {
    color: Color3 | Color4;
    label: string;
    rgbKey: RgbKey;
    onChange?: (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData & { rgbKey: RgbKey }) => void;
}

const InputRgbField = ({ color, onChange, label, rgbKey }: InputRgbFieldProps) => {
    const id = useId(`${label.toLowerCase()}-input`);
    const styles = useStyles();

    const handleChange = React.useCallback(
        (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
            const val = data.value ?? parseFloat(data.displayValue ?? "");

            if (val === null || Number.isNaN(val) || !NUMBER_REGEX.test(val.toString())) {
                return;
            }

            if (onChange) {
                onChange(event, { ...data, value: val / 255.0, rgbKey });
            }
        },
        [rgbKey, onChange, color]
    );

    return (
        <div className={styles.colorFieldWrapper}>
            <Label htmlFor={id}>{label}</Label>
            <SpinButton className={styles.spinButton} min={0} max={255} value={color[rgbKey] * 255.0} step={1} id={id} onChange={handleChange} name={rgbKey} />
        </div>
    );
};

// interface InputFieldProps {
//     val: number;
//     label: string;
//     key: string;
//     scale?: number;
//     max?: number;
//     onChange?: (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData & { key: string }) => void;
// }
// const InputField = ({ val, onChange, label, key,scale=1 }: InputFieldProps) => {
//     const id = useId(`${label.toLowerCase()}-input`);
//     const styles = useStyles();

//     const handleChange = React.useCallback(
//         (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
//             const val = data.value ?? parseFloat(data.displayValue ?? "");

//             if (val === null || Number.isNaN(val) || !NUMBER_REGEX.test(val.toString())) {
//                 return;
//             }

//             if (onChange) {
//                 onChange(event, { ...data, value: val / scale, key });
//             }
//         },
//         [key, onChange, color]
//     );

//     return (
//         <div className={styles.colorFieldWrapper}>
//             <Label htmlFor={id}>{label}</Label>
//             <SpinButton className={styles.spinButton} min={0} max={255} value={color[key] * scale} step={1} id={id} onChange={handleChange} name={key} />
//         </div>
//     );
// };

interface InputHsvFieldProps {
    color: Color3 | Color4;
    label: string;
    hsvKey: HsvKey;
    max: number;
    scale?: number;
    onChange?: (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData & { hsvKey: HsvKey }) => void;
}

/**
 * In the HSV (Hue, Saturation, Value) color model, Hue (H) ranges from 0 to 360 degrees, representing the color's position on the color wheel.
 * Saturation (S) ranges from 0 to 100%, indicating the intensity or purity of the color, with 0 being shades of gray and 100 being a fully saturated color.
 * Value (V) ranges from 0 to 100%, representing the brightness of the color, with 0 being black and 100 being the brightest.
 */
export const InputHsvField = ({ color, onChange, label, hsvKey, max, scale = 1 }: InputHsvFieldProps) => {
    const id = useId(`${label.toLowerCase()}-input`);
    const styles = useStyles();

    const handleChange = React.useCallback(
        (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
            const val = data.value ?? parseFloat(data.displayValue ?? "");

            if (val === null || Number.isNaN(val) || !NUMBER_REGEX.test(val.toString())) {
                return;
            }

            if (onChange) {
                onChange(event, { ...data, value: val / scale, hsvKey });
            }
        },
        [hsvKey, onChange, color]
    );

    return (
        <div className={styles.colorFieldWrapper}>
            <Label htmlFor={id}>{label}</Label>
            <SpinButton className={styles.spinButton} min={0} max={max} value={rgbaToHsv(color)[hsvKey] * scale} step={1} id={id} onChange={handleChange} name={hsvKey} />
        </div>
    );
};

interface InputAlphaProps {
    color: Color3 | Color4;
    label?: string;
    onChange?: SpinButtonProps["onChange"];
    id: string;
}

const InputAlphaField = ({ label = "Alpha", color, onChange, id }: InputAlphaProps) => {
    const styles = useStyles();

    return (
        <div className={styles.colorFieldWrapper}>
            <Label htmlFor={id}>{label}</Label>
            <SpinButton
                disabled={color instanceof Color3}
                min={0}
                max={1}
                className={styles.spinButton}
                value={color instanceof Color3 ? 1 : color.a}
                step={0.01}
                onChange={onChange}
                id={id}
            />
        </div>
    );
};

// const handleOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
//     const value = tinycolor(e.target.value);
//     if (!value.isValid) {
//         e.target.setAttribute("aria-invalid", "true");
//     } else {
//         e.target.removeAttribute("aria-invalid");
//     }
// };
