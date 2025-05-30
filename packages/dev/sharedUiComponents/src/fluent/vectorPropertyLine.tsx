// eslint-disable-next-line import/no-internal-modules
import { Vector3, Vector4 } from "core/index";

import { PropertyLine } from "shared-ui-components/fluent/propertyLine";
import { Text } from "shared-ui-components/fluent/primitives/text";
import { ObjectKeyInputLine } from "./objectKeyInputLine";

type IVectorPropertyLineProps = {
    vector: Vector3 | Vector4;
    label: string;
    centerAtZeroWithRange?: number;
    min?: number;
    max?: number;
};

/**
 * Reusable component which renders a vector property line containing a label, vector value, and expandable XYZW values
 * The expanded section contains a slider/input box for each component of the vector (x, y, z, w)
 */
export const VectorPropertyLine: React.FC<IVectorPropertyLineProps> = ({ vector, label, centerAtZeroWithRange, min, max }) => {
    const renderXYZExpand = (vector: Vector3 | Vector4) => {
        return (
            <>
                <ObjectKeyInputLine validKey="x" obj={vector} centerAtZeroWithRange={centerAtZeroWithRange} min={min} max={max} />
                <ObjectKeyInputLine validKey="y" obj={vector} centerAtZeroWithRange={centerAtZeroWithRange} min={min} max={max} />
                <ObjectKeyInputLine validKey="z" obj={vector} centerAtZeroWithRange={centerAtZeroWithRange} min={min} max={max} />
                {vector instanceof Vector4 && <ObjectKeyInputLine validKey="w" obj={vector} centerAtZeroWithRange={centerAtZeroWithRange} min={min} max={max} />}
            </>
        );
    };
    return (
        <PropertyLine label={label} renderExpandedContent={() => renderXYZExpand(vector)}>
            <Text>{vector.toString()}</Text>
        </PropertyLine>
    );
};
