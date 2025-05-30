import { type FunctionComponent } from "react";
import { PropertyLine } from "shared-ui-components/fluent/propertyLine";
import { Input } from "shared-ui-components/fluent/primitives/input";
import { Text } from "shared-ui-components/fluent/primitives/text";
import { copyCommandToClipboard } from "shared-ui-components/copyCommandToClipboard";

type CommonEntity = {
    id?: number;
    name?: string;
    uniqueId?: number;
    getClassName?: () => string;
};

const PropertyWrapper = (label: string, children: React.ReactNode, val?: string | number) => {
    return (
        val !== undefined && (
            <PropertyLine label={label} onCopy={() => copyCommandToClipboard(val.toString())}>
                {children}
            </PropertyLine>
        )
    );
};

export const CommonGeneralProperties: FunctionComponent<{ entity: CommonEntity }> = ({ entity: commonEntity }) => {
    return (
        <>
            {PropertyWrapper("ID", <Text>{commonEntity.id}</Text>, commonEntity.id)}
            {PropertyWrapper(
                "Name",
                <Input
                    value={commonEntity.name}
                    onChange={(event) => {
                        commonEntity.name = event.target.value; // TODO update so it rerenders
                    }}
                />,
                commonEntity.name
            )}
            {PropertyWrapper("Unique ID", <Text>{commonEntity.uniqueId}</Text>, commonEntity.uniqueId)}
            {PropertyWrapper("Class Name", <Text>{commonEntity.getClassName?.()}</Text>, commonEntity.getClassName?.())}
        </>
    );
};

// import type { FunctionComponent } from "react";
// import { PropertyLine } from "shared-ui-components/fluent/styledWrappers";

// type CommonEntity = {
//     id?: number;
//     name?: string;
//     uniqueId?: number;
//     getClassName?: () => string;
// };

// export const CommonGeneralProperties: FunctionComponent<{ entity: CommonEntity }> = ({ entity: commonEntity }) => {
//     const properties = {
//         ID: commonEntity.id,
//         Name: commonEntity.name,
//         UniqueId: commonEntity.uniqueId,
//         Class: commonEntity.getClassName ? commonEntity.getClassName() : undefined,
//     };

//     return (
//         <>
//             {Object.entries(properties).forEach(([key, value]) => {
//                 return value !== undefined && <PropertyLine key={key} label={key} children={<>{value}</>} />;
//             })}
//         </>
//     );
// };
