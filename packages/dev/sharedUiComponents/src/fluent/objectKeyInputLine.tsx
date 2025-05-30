import { Input } from "@fluentui/react-components";
import { PropertyLine } from "./propertyLine";
import { SyncedSliderInput } from "./primitives/syncedSlider";

type ObjectKeyInputLineProps<O, K extends string & keyof O> = {
    validKey: K;
    obj: O;
    centerAtZeroWithRange?: number;
    min?: number;
    max?: number;
};

/**
 * Renders a property line for a given key/value pair (ex: can be used for a color's RGBA values, a vector's XYZ values, etc)
 * Example usage looks like
 *    <VectorLine key="x" obj={vector} />
 *    <VectorLine key="r" obj={color} />
 * @param param0
 * @returns
 */

export const ObjectKeyInputLine = <O extends Record<K, number>, K extends keyof O & string>({
    validKey,
    obj,
    centerAtZeroWithRange,
    min,
    max,
}: ObjectKeyInputLineProps<O, K>): React.ReactElement => {
    return (
        <PropertyLine label={validKey}>
            <SyncedSliderInput value={obj[validKey]} onChange={(val) => (obj[validKey] = val as O[K])} centerAtZeroWithRange={centerAtZeroWithRange} min={min} max={max} />
        </PropertyLine>
    );
};
