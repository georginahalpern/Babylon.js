// eslint-disable-next-line import/no-internal-modules
import { Color3, Color4 } from "core/index";

import { PropertyLine } from "shared-ui-components/fluent/propertyLine";
import { Text } from "shared-ui-components/fluent/primitives/text";
import { ObjectKeyInputLine } from "./objectKeyInputLine";

type IColorPropertyLineProps = {
    color: Color3 | Color4;
    label: string;
};

/**
 * Reusable component which renders a color property line containing a label, colorPicker popout, and expandable RGBA values
 * The expandable RGBA values are synced sliders that allow the user to modify the color's RGBA values directly
 */
export const ColorPropertyLine: React.FC<IColorPropertyLineProps> = (props: IColorPropertyLineProps) => {
    const renderRGBExpand = (color: Color3 | Color4) => {
        return (
            <>
                <ObjectKeyInputLine validKey="r" obj={color} min={0} max={255} />
                <ObjectKeyInputLine validKey="g" obj={color} min={0} max={255} />
                <ObjectKeyInputLine validKey="b" obj={color} min={0} max={255} />
                {color instanceof Color4 && <ObjectKeyInputLine validKey="a" obj={color} min={0} max={1} />}
            </>
        );
    };
    return (
        <PropertyLine label={props.label} renderExpandedContent={() => renderRGBExpand(props.color)}>
            <Text>{props.color.toString()}</Text>
        </PropertyLine>
    );
};
