// src/types/react-summernote.d.ts
declare module "react-summernote" {
  import * as React from "react";

  interface ReactSummernoteProps {
    id?: string;  
    value?: string;
    options?: any;
    onChange?: (content: string) => void;
    onInit?: () => void;
  }

  export default class ReactSummernote extends React.Component<
    ReactSummernoteProps
  > {}
}
