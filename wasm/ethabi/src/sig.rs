use crate::datatypes::{parse_param_type, tokenize};
use ethabi::param_type::ParamType;

#[derive(Serialize, Debug, PartialEq)]
pub struct AbiInput {
    #[serde(skip_serializing_if = "Option::is_none")]
    name: Option<String>,
    #[serde(rename = "type")]
    data_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    components: Option<Vec<AbiInput>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    indexed: Option<bool>,
}

#[derive(Serialize, Debug, PartialEq)]
pub struct AbiItem {
    name: String,
    inputs: Vec<AbiInput>,
}

fn param_to_abi_input(param: &ParamType, indexed: Option<bool>) -> AbiInput {
    match param {
        ParamType::Tuple(inner) => AbiInput {
            name: None,
            data_type: String::from("tuple"),
            components: Some(
                inner
                    .iter()
                    .map(|p| param_to_abi_input(p, None))
                    .collect::<Vec<AbiInput>>(),
            ),
            indexed: indexed,
        },
        _ => AbiInput {
            name: None,
            data_type: format!("{}", param),
            components: None,
            indexed: indexed,
        },
    }
}

fn parse_fn_args(args_str: &String, allow_indexed_flag: bool) -> Result<Vec<AbiInput>, String> {
    if args_str.chars().next() != Some('(') || args_str.chars().last() != Some(')') {
        return Err(String::from(
            "Unable to parse signature: Invalid argument list",
        ));
    }
    let tokens = match tokenize(&args_str[1..(args_str.len() - 1)]) {
        Ok(t) => t,
        Err(e) => return Err(format!("{}", e)),
    };
    let mut inputs = Vec::new();
    for token in tokens {
        let mut indexed = None;
        let mut cur = token;
        if allow_indexed_flag {
            if cur.ends_with(" indexed") {
                cur = &cur[0..(cur.len() - 8)];
                indexed = Some(true);
            } else {
                indexed = Some(false);
            }
        }
        match parse_param_type(&String::from(cur)) {
            Ok(p) => {
                inputs.push(param_to_abi_input(&p, indexed));
            }
            Err(e) => {
                return Err(format!("Unable to parse signature: {}", e));
            }
        }
    }
    return Ok(inputs);
}

fn is_valid_function_name(name: &str) -> bool {
    name.chars().all(|ch| ch == '_' || ch.is_alphanumeric())
}

pub fn parse_signature(sig: &String, allow_indexed_flag: bool) -> Result<AbiItem, String> {
    match sig.chars().position(|c| c == '(') {
        Some(pos) => {
            let name = &sig[..pos];
            if name.len() == 0 {
                return Err(String::from(
                    "Unable to parse signature: Empty function name",
                ));
            }
            if !is_valid_function_name(name) {
                return Err(format!(
                    "Unable to parse signature: Invalid function name: {:?}",
                    name
                ));
            }
            let args = &sig[pos..];
            match parse_fn_args(&String::from(args), allow_indexed_flag) {
                Ok(args) => Ok(AbiItem {
                    name: String::from(name),
                    inputs: args,
                }),
                Err(msg) => Err(format!("{}", msg)),
            }
        }
        None => Err(String::from(
            "Unable to parse signature: no open parenthesis found",
        )),
    }
}
