import type { FunctionComponent } from "react";
import { Dialog, DialogSurface, DialogTitle, DialogActions, Button, DialogContent } from "@fluentui/react-components";

interface IFluentDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Dialog title */
    title?: string;
    /** Dialog message content */
    message: string;
    /** Whether this is an error dialog (affects title default) */
    isError?: boolean;
    /** Callback when dialog is closed */
    onClose: () => void;
}

/**
 * Fluent UI Dialog component for displaying messages and errors
 * @param props - Dialog properties
 * @returns Functional component
 */
export const FluentDialog: FunctionComponent<IFluentDialogProps> = ({ open, title, message, isError = false, onClose }) => {
    const dialogTitle = title ?? (isError ? "Error" : "Message");

    return (
        <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogContent>{message}</DialogContent>
                <DialogActions>
                    <Button appearance="primary" onClick={onClose}>
                        OK
                    </Button>
                </DialogActions>
            </DialogSurface>
        </Dialog>
    );
};
