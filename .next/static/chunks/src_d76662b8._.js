(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/hooks/use-toast.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "reducer",
    ()=>reducer,
    "toast",
    ()=>toast,
    "useToast",
    ()=>useToast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;
const actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST"
};
let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}
const toastTimeouts = new Map();
const addToRemoveQueue = (toastId)=>{
    if (toastTimeouts.has(toastId)) {
        return;
    }
    const timeout = setTimeout(()=>{
        toastTimeouts.delete(toastId);
        dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId
        });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action)=>{
    switch(action.type){
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [
                    action.toast,
                    ...state.toasts
                ].slice(0, TOAST_LIMIT)
            };
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t)=>t.id === action.toast.id ? {
                        ...t,
                        ...action.toast
                    } : t)
            };
        case "DISMISS_TOAST":
            {
                const { toastId } = action;
                if (toastId) {
                    addToRemoveQueue(toastId);
                } else {
                    state.toasts.forEach((toast)=>{
                        addToRemoveQueue(toast.id);
                    });
                }
                return {
                    ...state,
                    toasts: state.toasts.map((t)=>t.id === toastId || toastId === undefined ? {
                            ...t,
                            open: false
                        } : t)
                };
            }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: []
                };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t)=>t.id !== action.toastId)
            };
    }
};
const listeners = [];
let memoryState = {
    toasts: []
};
function dispatch(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener)=>{
        listener(memoryState);
    });
}
function toast(param) {
    let { ...props } = param;
    const id = genId();
    const update = (props)=>dispatch({
            type: "UPDATE_TOAST",
            toast: {
                ...props,
                id
            }
        });
    const dismiss = ()=>dispatch({
            type: "DISMISS_TOAST",
            toastId: id
        });
    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open)=>{
                if (!open) dismiss();
            }
        }
    });
    return {
        id: id,
        dismiss,
        update
    };
}
function useToast() {
    _s();
    const [state, setState] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](memoryState);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "useToast.useEffect": ()=>{
            listeners.push(setState);
            return ({
                "useToast.useEffect": ()=>{
                    const index = listeners.indexOf(setState);
                    if (index > -1) {
                        listeners.splice(index, 1);
                    }
                }
            })["useToast.useEffect"];
        }
    }["useToast.useEffect"], [
        state
    ]);
    return {
        ...state,
        toast,
        dismiss: (toastId)=>dispatch({
                type: "DISMISS_TOAST",
                toastId
            })
    };
}
_s(useToast, "SPWE98mLGnlsnNfIwu/IAKTSZtk=");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn() {
    for(var _len = arguments.length, inputs = new Array(_len), _key = 0; _key < _len; _key++){
        inputs[_key] = arguments[_key];
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/toast.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toast",
    ()=>Toast,
    "ToastAction",
    ()=>ToastAction,
    "ToastClose",
    ()=>ToastClose,
    "ToastDescription",
    ()=>ToastDescription,
    "ToastProvider",
    ()=>ToastProvider,
    "ToastTitle",
    ()=>ToastTitle,
    "ToastViewport",
    ()=>ToastViewport
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-toast/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
;
;
;
const ToastProvider = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Provider"];
const ToastViewport = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = (param, ref)=>{
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Viewport"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 16,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = ToastViewport;
ToastViewport.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Viewport"].displayName;
const toastVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full", {
    variants: {
        variant: {
            default: "border bg-background text-foreground",
            destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
const Toast = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c2 = (param, ref)=>{
    let { className, variant, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(toastVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 49,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
_c3 = Toast;
Toast.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"].displayName;
const ToastAction = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c4 = (param, ref)=>{
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Action"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 62,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
});
_c5 = ToastAction;
ToastAction.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Action"].displayName;
const ToastClose = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c6 = (param, ref)=>{
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600", className),
        "toast-close": "",
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/src/components/ui/toast.tsx",
            lineNumber: 86,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 77,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
});
_c7 = ToastClose;
ToastClose.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"].displayName;
const ToastTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c8 = (param, ref)=>{
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm font-semibold", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 95,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
});
_c9 = ToastTitle;
ToastTitle.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"].displayName;
const ToastDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c10 = (param, ref)=>{
    let { className, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm opacity-90", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 107,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
});
_c11 = ToastDescription;
ToastDescription.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"].displayName;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "ToastViewport$React.forwardRef");
__turbopack_context__.k.register(_c1, "ToastViewport");
__turbopack_context__.k.register(_c2, "Toast$React.forwardRef");
__turbopack_context__.k.register(_c3, "Toast");
__turbopack_context__.k.register(_c4, "ToastAction$React.forwardRef");
__turbopack_context__.k.register(_c5, "ToastAction");
__turbopack_context__.k.register(_c6, "ToastClose$React.forwardRef");
__turbopack_context__.k.register(_c7, "ToastClose");
__turbopack_context__.k.register(_c8, "ToastTitle$React.forwardRef");
__turbopack_context__.k.register(_c9, "ToastTitle");
__turbopack_context__.k.register(_c10, "ToastDescription$React.forwardRef");
__turbopack_context__.k.register(_c11, "ToastDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/toaster.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toaster",
    ()=>Toaster
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-toast.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/toast.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function Toaster() {
    _s();
    const { toasts } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastProvider"], {
        children: [
            toasts.map(function(param) {
                let { id, title, description, action, ...props } = param;
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Toast"], {
                    ...props,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid gap-1",
                            children: [
                                title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastTitle"], {
                                    children: title
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ui/toaster.tsx",
                                    lineNumber: 22,
                                    columnNumber: 25
                                }, this),
                                description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastDescription"], {
                                    children: description
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ui/toaster.tsx",
                                    lineNumber: 24,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ui/toaster.tsx",
                            lineNumber: 21,
                            columnNumber: 13
                        }, this),
                        action,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastClose"], {}, void 0, false, {
                            fileName: "[project]/src/components/ui/toaster.tsx",
                            lineNumber: 28,
                            columnNumber: 13
                        }, this)
                    ]
                }, id, true, {
                    fileName: "[project]/src/components/ui/toaster.tsx",
                    lineNumber: 20,
                    columnNumber: 11
                }, this);
            }),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastViewport"], {}, void 0, false, {
                fileName: "[project]/src/components/ui/toaster.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/toaster.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
_s(Toaster, "1YTCnXrq2qRowe0H/LBWLjtXoYc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = Toaster;
var _c;
__turbopack_context__.k.register(_c, "Toaster");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/theme-provider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.mjs [app-client] (ecmascript)");
"use client";
;
;
function ThemeProvider(param) {
    let { children, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeProvider"], {
        ...props,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/theme-provider.tsx",
        lineNumber: 8,
        columnNumber: 10
    }, this);
}
_c = ThemeProvider;
var _c;
__turbopack_context__.k.register(_c, "ThemeProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Environment-aware API configuration
__turbopack_context__.s([
    "apiService",
    ()=>apiService,
    "calculateDailySalary",
    ()=>calculateDailySalary,
    "calculateWeeklySalary",
    ()=>calculateWeeklySalary,
    "saveAgencyInsights",
    ()=>saveAgencyInsights,
    "saveModelInsights",
    ()=>saveModelInsights
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
;
const getApiBaseUrl = ()=>{
    // Check for environment variable first (production)
    if ("TURBOPACK compile-time truthy", 1) {
        return "TURBOPACK compile-time value", "http://localhost:8000";
    }
    //TURBOPACK unreachable
    ;
};
const API_BASE_URL = getApiBaseUrl();
const API_PREFIX = '/api/v1';
console.log('API Service initialized with base URL:', API_BASE_URL);
console.log('Environment:', ("TURBOPACK compile-time value", "development"));
class ApiService {
    async request(endpoint) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const url = "".concat(this.baseUrl).concat(endpoint);
        // Get token from cookies instead of localStorage
        const getCookie = (name)=>{
            var _parts_pop;
            const value = "; ".concat(document.cookie);
            const parts = value.split("; ".concat(name, "="));
            if (parts.length === 2) return (_parts_pop = parts.pop()) === null || _parts_pop === void 0 ? void 0 : _parts_pop.split(';').shift();
            return null;
        };
        const token = getCookie('access_token');
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...token && {
                    'Authorization': "Bearer ".concat(token)
                },
                ...options.headers
            },
            credentials: 'include'
        };
        console.log("Making API request to: ".concat(url));
        console.log('Request options:', {
            ...defaultOptions,
            ...options
        });
        // Debug cookies and token
        console.log('Current cookies:', document.cookie);
        console.log('Auth token:', token ? 'Present' : 'Missing');
        try {
            const response = await fetch(url, {
                ...defaultOptions,
                ...options
            });
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                // Handle authentication errors specifically
                if (response.status === 403) {
                    throw new Error('Authentication failed. Please log in again.');
                }
                throw new Error("HTTP error! status: ".concat(response.status, ", message: ").concat(errorText));
            }
            const data = await response.json();
            console.log('API Response data:', data);
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    // Admin Management APIs
    async registerAdmin(payload) {
        return this.request('/admin/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    async loginAdmin(payload) {
        return this.request('/admin/login', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    async logoutAdmin() {
        return this.request('/admin/logout', {
            method: 'GET'
        });
    }
    async getAdminDetails(identifier) {
        return this.request("/admin/details?identifier=".concat(encodeURIComponent(identifier)));
    }
    async getAllAdmins() {
        let params = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach((param)=>{
            let [key, value] = param;
            if (value !== undefined) {
                searchParams.append(key, value.toString());
            }
        });
        return this.request("/admin/get_all_admin?".concat(searchParams.toString()));
    }
    async updateAdmin(adminId, payload) {
        return this.request("/admin/update?admin_id=".concat(encodeURIComponent(adminId)), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }
    async deleteAdmin(adminId) {
        return this.request("/admin/delete?admin_id=".concat(encodeURIComponent(adminId)), {
            method: 'DELETE'
        });
    }
    // Chatter Management APIs
    async createChatter(payload) {
        return this.request('/chatter/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    async getAllChatters() {
        let params = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach((param)=>{
            let [key, value] = param;
            if (value !== undefined) {
                searchParams.append(key, value.toString());
            }
        });
        return this.request("/chatter/list?".concat(searchParams.toString()));
    }
    async getChattersWithSalaryData() {
        let params = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach((param)=>{
            let [key, value] = param;
            if (value !== undefined) {
                searchParams.append(key, value.toString());
            }
        });
        return this.request("/chatter/list-with-salary?".concat(searchParams.toString()));
    }
    async getChatterDetails(chatterId) {
        return this.request("/chatter/details?chatter_id=".concat(encodeURIComponent(chatterId)));
    }
    async updateChatter(chatterId, payload) {
        return this.request("/chatter/update?chatter_id=".concat(encodeURIComponent(chatterId)), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }
    async deleteChatter(chatterId) {
        return this.request("/chatter/delete?chatter_id=".concat(encodeURIComponent(chatterId)), {
            method: 'DELETE'
        });
    }
    async getChatterRates(chatterId) {
        return this.request("/chatter/rates?chatter_id=".concat(encodeURIComponent(chatterId)));
    }
    async addChatterRate(chatterId, payload) {
        return this.request("/chatter/rate/add?chatter_id=".concat(encodeURIComponent(chatterId)), {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    async updateChatterRates(chatterId, payload) {
        return this.request("/chatter/rate/update?chatter_id=".concat(encodeURIComponent(chatterId)), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }
    async deleteChatterRate(rateId) {
        return this.request("/chatter/rate/delete?rate_id=".concat(encodeURIComponent(rateId)), {
            method: 'DELETE'
        });
    }
    async updateChatterPayoutStatus(chatterId, period, year) {
        let paymentStatus = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 'Not Paid';
        const params = new URLSearchParams({
            chatter_id: chatterId,
            period: period,
            payment_status: paymentStatus,
            ...year && {
                year: year.toString()
            }
        });
        return this.request("/payouts/update?".concat(params.toString()), {
            method: 'PUT'
        });
    }
    // Manager Management APIs
    async createManager(payload) {
        return this.request('/manager/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    async getAllManagers() {
        let params = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach((param)=>{
            let [key, value] = param;
            if (value !== undefined) {
                searchParams.append(key, value.toString());
            }
        });
        return this.request("/manager/list?".concat(searchParams.toString()));
    }
    async getManagersWithPeriodSalaries(periods, year) {
        const queryParams = new URLSearchParams();
        queryParams.append('periods', periods.join(','));
        if (year) queryParams.append('year', year.toString());
        return this.request("/managers/with-salaries?".concat(queryParams.toString()));
    }
    async getManagerDetails(managerId) {
        return this.request("/manager/details?manager_id=".concat(encodeURIComponent(managerId)));
    }
    async updateManager(managerId, payload) {
        return this.request("/manager/update?manager_id=".concat(encodeURIComponent(managerId)), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }
    async deleteManager(managerId) {
        return this.request("/manager/delete?manager_id=".concat(encodeURIComponent(managerId)), {
            method: 'DELETE'
        });
    }
    // Team Leader APIs (separate table)
    async getAllTeamLeaders() {
        let params = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach((param)=>{
            let [key, value] = param;
            if (value !== undefined) {
                searchParams.append(key, value.toString());
            }
        });
        return this.request("/team-leader/list?".concat(searchParams.toString()));
    }
    async createTeamLeader(payload) {
        return this.request('/team-leader/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    async updateTeamLeader(teamLeaderId, payload) {
        return this.request("/team-leader/update?team_leader_id=".concat(encodeURIComponent(teamLeaderId)), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }
    async deleteTeamLeader(teamLeaderId) {
        return this.request("/team-leader/delete?team_leader_id=".concat(encodeURIComponent(teamLeaderId)), {
            method: 'DELETE'
        });
    }
    async getTeamLeaderDetails(teamLeaderId) {
        return this.request("/team-leader/details?team_leader_id=".concat(encodeURIComponent(teamLeaderId)));
    }
    // Assistant Management APIs
    async createAssistant(payload) {
        return this.request('/assistant/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    async getAllAssistants() {
        let params = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach((param)=>{
            let [key, value] = param;
            if (value !== undefined) {
                searchParams.append(key, value.toString());
            }
        });
        return this.request("/assistant/list?".concat(searchParams.toString()));
    }
    async getAssistantDetails(assistantId) {
        return this.request("/assistant/details?assistant_id=".concat(encodeURIComponent(assistantId)));
    }
    async updateAssistant(assistantId, payload) {
        return this.request("/assistant/update?assistant_id=".concat(encodeURIComponent(assistantId)), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }
    async deleteAssistant(assistantId) {
        return this.request("/assistant/delete?assistant_id=".concat(encodeURIComponent(assistantId)), {
            method: 'DELETE'
        });
    }
    // Reports Management APIs
    async getReportsPeriods(year) {
        const params = year ? "?year=".concat(year) : '';
        return this.request("/reports/periods".concat(params));
    }
    async getChatterWeeklyReport(chatterId, period, year) {
        let week = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 1;
        const params = new URLSearchParams({
            chatter_id: chatterId,
            period: period,
            week: week.toString(),
            ...year && {
                year: year.toString()
            }
        });
        return this.request("/reports/week/get?".concat(params.toString()));
    }
    async saveChatterWeeklyReport(payload) {
        return this.request('/reports/week/save', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    async getReportsSummary(period, year, week) {
        const params = new URLSearchParams({
            period: period,
            ...year && {
                year: year.toString()
            },
            ...week && {
                week: week.toString()
            }
        });
        return this.request("/reports/summary?".concat(params.toString()));
    }
    async getChatterSalaryData(chatterId, period, year) {
        const params = new URLSearchParams({
            chatter_id: chatterId,
            period: period,
            ...year && {
                year: year.toString()
            }
        });
        return this.request("/reports/chatter-salary?".concat(params.toString()));
    }
    async getChatterPayouts(period, year) {
        const params = new URLSearchParams({
            period: period,
            ...year && {
                year: year.toString()
            }
        });
        return this.request("/payouts/list?".concat(params.toString()));
    }
    // Salary Management APIs
    async getManagerSalaryPeriods(year) {
        const params = year ? "?year=".concat(year) : '';
        return this.request("/manager/salary/periods".concat(params));
    }
    async calculateManagerSalary(managerId, period, year) {
        const params = new URLSearchParams({
            manager_id: managerId,
            period: period,
            ...year && {
                year: year.toString()
            }
        });
        return this.request("/manager/salary/calculate?".concat(params.toString()), {
            method: 'POST'
        });
    }
    async getAssistantSalaryPeriods(year) {
        const params = year ? "?year=".concat(year) : '';
        return this.request("/assistant/salary/periods".concat(params));
    }
    async calculateAssistantSalary(assistantId, period, year) {
        const params = new URLSearchParams({
            assistant_id: assistantId,
            period: period,
            ...year && {
                year: year.toString()
            }
        });
        return this.request("/assistant/salary/calculate?".concat(params.toString()), {
            method: 'POST'
        });
    }
    async getAssistantsWithPeriodSalaries(periods, year) {
        const params = new URLSearchParams({
            periods: periods.join(','),
            ...year && {
                year: year.toString()
            }
        });
        return this.request("/assistants/with-salaries?".concat(params.toString()));
    }
    // Health check
    async healthCheck() {
        return this.request('/');
    }
    // Model Management APIs
    async createModel(payload) {
        return this.request('/model/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    async getAllModels() {
        let params = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach((param)=>{
            let [key, value] = param;
            if (value !== undefined) {
                searchParams.append(key, value.toString());
            }
        });
        return this.request("/model/list?".concat(searchParams.toString()));
    }
    async getModelDetails(modelId) {
        return this.request("/model/details?model_id=".concat(encodeURIComponent(modelId)));
    }
    async updateModel(modelId, payload) {
        return this.request("/model/update?model_id=".concat(encodeURIComponent(modelId)), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }
    async deleteModel(modelId) {
        return this.request("/model/delete?model_id=".concat(encodeURIComponent(modelId)), {
            method: 'DELETE'
        });
    }
    // Insights Management APIs
    async getAgencyInsights(period, year, week) {
        const params = new URLSearchParams({
            period: period,
            ...year && {
                year: year.toString()
            },
            ...week && {
                week: week.toString()
            }
        });
        return this.request("/insights/agency?".concat(params.toString()));
    }
    async getDashboardKPIs(period, year, week) {
        const params = new URLSearchParams({
            period: period,
            ...year && {
                year: year.toString()
            },
            ...week && {
                week: week.toString()
            }
        });
        return this.request("/dashboard/kpis?".concat(params.toString()));
    }
    async getModelInsights(modelId, period, year, week) {
        const params = new URLSearchParams({
            period: period,
            ...year && {
                year: year.toString()
            },
            ...week && {
                week: week.toString()
            }
        });
        return this.request("/insights/model/".concat(modelId, "?").concat(params.toString()));
    }
    async getModelCostBreakdown(modelId, period, year, week) {
        const params = new URLSearchParams({
            period: period,
            ...year && {
                year: year.toString()
            },
            ...week && {
                week: week.toString()
            }
        });
        return this.request("/insights/model/cost-breakdown/".concat(modelId, "?").concat(params.toString()));
    }
    async getLeaderboards(period, year, week) {
        const params = new URLSearchParams({
            period: period,
            ...year && {
                year: year.toString()
            },
            ...week && {
                week: week.toString()
            }
        });
        return this.request("/dashboard/leaderboards?".concat(params.toString()));
    }
    async listInvoices() {
        let params = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach((param)=>{
            let [key, value] = param;
            if (value !== undefined) {
                queryParams.append(key, value.toString());
            }
        });
        return this.request("/invoices/list?".concat(queryParams.toString()));
    }
    async createInvoice(payload) {
        return this.request('/invoice/create', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    async updateInvoice(invoiceId, updates) {
        let autoCalculate = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
        return this.request("/invoice/update?invoice_id=".concat(encodeURIComponent(invoiceId), "&auto_calculate=").concat(autoCalculate), {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
    async calculateInvoice(invoiceData) {
        return this.request('/invoice/calculate', {
            method: 'POST',
            body: JSON.stringify(invoiceData)
        });
    }
    async recomputeStaffCosts(period, year, week) {
        const params = new URLSearchParams({
            period: period,
            ...year && {
                year: year.toString()
            },
            ...week && {
                week: week.toString()
            }
        });
        return this.request("/insights/recompute-costs?".concat(params.toString()), {
            method: 'POST'
        });
    }
    async recomputeStaffCostsMonth(month, year) {
        const params = new URLSearchParams({
            month: month,
            year: year.toString()
        });
        return this.request("/recompute-costs-month?".concat(params.toString()), {
            method: 'POST'
        });
    }
    async saveAgencyInsights(data) {
        return this.request('/insights/agency/save', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    async saveModelInsights(data) {
        return this.request('/insights/model/save', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    async getSavedAgencyInsights(period, year, week) {
        const params = new URLSearchParams({
            period: period,
            year: year.toString(),
            ...week && {
                week: week.toString()
            }
        });
        return this.request("/insights/agency/saved?".concat(params.toString()));
    }
    async getSavedModelInsights(modelId, period, year, week) {
        const params = new URLSearchParams({
            model_id: modelId,
            period: period,
            year: year.toString(),
            ...week && {
                week: week.toString()
            }
        });
        return this.request("/insights/model/saved?".concat(params.toString()));
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "baseUrl", void 0);
        this.baseUrl = "".concat(API_BASE_URL).concat(API_PREFIX);
        console.log('API Service initialized with base URL:', this.baseUrl);
    }
}
const apiService = new ApiService();
const calculateDailySalary = async (request)=>{
    try {
        // Backend expects chatter_id and work_date as query params and body as a list of work_rows
        const params = new URLSearchParams({
            chatter_id: request.chatter_id,
            work_date: request.work_date
        });
        return await apiService['request']("/salary/calculate-daily?".concat(params.toString()), {
            method: 'POST',
            body: JSON.stringify(request.work_rows)
        });
    } catch (error) {
        console.error('Error calculating daily salary:', error);
        return {
            status: 'Failed',
            message: error instanceof Error ? error.message : 'Failed to calculate daily salary',
            data: null
        };
    }
};
const calculateWeeklySalary = async (request)=>{
    try {
        // Backend expects all params in the query string; POST with no body
        const params = new URLSearchParams({
            chatter_id: request.chatter_id,
            period: request.period,
            year: request.year.toString(),
            week: request.week.toString()
        });
        return await apiService['request']("/salary/calculate-week?".concat(params.toString()), {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error calculating weekly salary:', error);
        return {
            status: 'Failed',
            message: error instanceof Error ? error.message : 'Failed to calculate weekly salary',
            data: null
        };
    }
};
const saveAgencyInsights = async (data)=>{
    try {
        return await apiService['request']('/insights/agency/save', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Error saving agency insights:', error);
        return {
            status: 'Failed',
            message: 'Failed to save agency insights',
            data: null
        };
    }
};
const saveModelInsights = async (data)=>{
    try {
        return await apiService['request']('/insights/model/save', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Error saving model insights:', error);
        return {
            status: 'Failed',
            message: 'Failed to save model insights',
            data: null
        };
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/auth-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider(param) {
    let { children } = param;
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const isAuthenticated = !!user;
    const login = (userData)=>{
        setUser(userData);
        // Store user data in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData));
    };
    const logout = async ()=>{
        try {
            // Call the logout API endpoint
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiService"].logoutAdmin();
        } catch (error) {
            console.error('Logout API call failed:', error);
        // Continue with local logout even if API call fails
        } finally{
            // Clear local state and storage
            setUser(null);
            localStorage.removeItem('user');
            // Clear the auth cookie
            document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
    };
    const checkAuth = async ()=>{
        try {
            // Check if user data exists in localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        } finally{
            setIsLoading(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            checkAuth();
        }
    }["AuthProvider.useEffect"], []);
    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/lib/auth-context.tsx",
        lineNumber: 86,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "YajQB7LURzRD+QP5gw0+K2TZIWA=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_d76662b8._.js.map