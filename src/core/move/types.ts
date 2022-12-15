export interface ModuleABI {
  address: string;
  name: string;
  friends: string[];
  exposed_functions: MoveFunctionABI[];
  structs: MoveStructABI[];
}

export interface MoveFunctionABI {
  name: string;
  visibility: string;
  is_entry: boolean;
  generic_type_params: {
    constraints: string[];
  }[];
  params: string[];
  return: string[];
}

export interface MoveStructABI {
  name: string;
  is_native: boolean;
  abilities: string[];
  generic_type_params: {
    constraints: string[];
    is_phantom: boolean;
  };
  fields: {
    name: string;
    type: string;
  }[];
}
