import { type FunctionComponent } from "react";
import { PropertyLine } from "shared-ui-components/fluent/propertyLine";
import { Input } from "shared-ui-components/fluent/primitives/input";
import { Text } from "shared-ui-components/fluent/primitives/text";

type CommonEntity = {
    id?: number;
    name?: string;
    uniqueId?: number;
    getClassName?: () => string;
};

const PropertyWrapper = (label: string, children: React.ReactNode, val?: string | number) => {
    return (
        val !== undefined && (
            <PropertyLine label={label} onCopy={() => val.toString()}>
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
                    appearance="underline"
                    value={commonEntity.name}
                    onChange={(event) => {
                        commonEntity.name = event.target.value;
                    }}
                />,
                commonEntity.name
            )}
            {PropertyWrapper("Unique ID", <Text>{commonEntity.uniqueId}</Text>, commonEntity.uniqueId)}
            {PropertyWrapper("Class Name", <Text>{commonEntity.getClassName?.()}</Text>, commonEntity.getClassName?.())}
        </>
    );
};
