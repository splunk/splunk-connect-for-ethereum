mod values;
mod sig;
mod datatypes;

#[macro_use]
extern crate serde_derive;

use ethabi::decode;
use ethabi::param_type::{ParamType};
use values::{token_to_value, Value};
use wasm_bindgen::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND_CONTENT: &'static str = r#"
export type ParameterValue = null | string | number | boolean | Array<ParameterValue>;
export type DecodedParameters = ParameterValue[];
export function abi_decode_parameters(data: Uint8Array, type_list: string[]): DecodedParameters;
export interface AbiInput { type: string; components?: AbiInput[]; }
export interface AbiItem { name?: string; inputs: AbiInput[]; }
export function parse_signature(signature: string): AbiItem;
"#;

#[derive(Serialize, Debug)]
pub struct DecodedParameters(Vec<Value>);

fn encode_type_list(type_list: Box<[JsValue]>) -> String {
    return format!(
        "({})",
        type_list
            .iter()
            .map(|v| {
                if v.is_string() {
                    v.as_string().unwrap()
                } else {
                    "<<INVALID>>".to_string()
                }
            })
            .collect::<Vec<String>>()
            .join(",")
    );
}

#[wasm_bindgen]
pub fn abi_decode_parameters(data: &[u8], type_list: Box<[JsValue]>) -> Result<JsValue, JsValue> {
    match datatypes::parse_param_type(&encode_type_list(type_list)) {
        Ok(ParamType::Tuple(params)) => {
            let p = params
                .iter()
                .map(|p| *(*p).clone())
                .collect::<Vec<ParamType>>();
            match decode(&p[..], data) {
                Ok(tokens) => Ok(JsValue::from_serde(&DecodedParameters(
                    tokens.iter().map(|t| token_to_value(&t)).collect(),
                ))
                .unwrap()),
                Err(err) => Err(JsValue::from(format!("Failed to decode: {:?}", err))),
            }
        }
        Err(e) => Err(JsValue::from(format!("Failed to decode: {:?}", e))),
        _ => Err(JsValue::from_str("Unable to parse parameter list")),
    }
}

#[wasm_bindgen]
pub fn parse_function_signature(signature: String) -> Result<JsValue, JsValue> {
    match sig::parse_signature(&signature, false) {
        Ok(item) => match JsValue::from_serde(&item) {
            Ok(val) => Ok(val),
            Err(e) => Err(JsValue::from(format!("Failed to serialize result: {}", e))),
        },
        Err(msg) => Err(JsValue::from(msg)),
    }
}

#[wasm_bindgen]
pub fn parse_event_signature(signature: String) -> Result<JsValue, JsValue> {
    match sig::parse_signature(&signature, true) {
        Ok(item) => match JsValue::from_serde(&item) {
            Ok(val) => Ok(val),
            Err(e) => Err(JsValue::from(format!("Failed to serialize result: {}", e))),
        },
        Err(msg) => Err(JsValue::from(msg)),
    }
}

#[wasm_bindgen]
pub fn is_valid_param_type(type_str: String) -> bool {
    match datatypes::parse_param_type(&type_str) {
        Ok(_) => true,
        Err(_) => false,
    }
}

#[wasm_bindgen]
pub fn get_canonical_type(type_str: String) -> Result<String, JsValue> {
    match datatypes::parse_param_type(&type_str) {
        Ok(t) => Ok(format!("{}", t)),
        Err(e) => Err(JsValue::from(format!("{}", e))),
    }
}

#[wasm_bindgen]
pub fn is_array_type(data_type: String) -> Result<bool, JsValue> {
    match datatypes::parse_param_type(&data_type) {
        Ok(ParamType::Array(_)) => Ok(true),
        Ok(ParamType::FixedArray(_,_)) => Ok(true),
        Ok(_) => Ok(false),
        Err(e) => Err(JsValue::from(format!("{}", e))),
    }
}

#[derive(Serialize, Debug)]
pub struct ParamDataSize {
    length: usize,
    exact: bool,
}

#[wasm_bindgen]
pub fn get_data_size(type_str: String) -> Result<JsValue, JsValue> {
    match datatypes::parse_param_type(&type_str) {
        Ok(t) => match datatypes::get_data_size(&t) {
            (size, exact) => match JsValue::from_serde(&ParamDataSize{ length: size, exact: exact }) {
                Ok(val) => Ok(val),
                Err(e) => Err(JsValue::from(format!("Failed to serialize result: {}", e))),
            }
        },
        Err(err) => Err(JsValue::from(err)),
    }
}

// #[wasm_bindgen]
// pub fn to_checksum_address(address_str: String) -> Result<String, JsValue> {
//     let address: Address = address_str.into();

//     Ok(format!(""))
// }

const NULL_SHA3: &'static str = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";

#[wasm_bindgen]
pub fn sha3(s: String) -> Option<String> {
    let hash = if s.starts_with("0x") {
        match values::from_hex(&s) {
            Ok(v) => tiny_keccak::keccak256(&v),
            Err(_) => tiny_keccak::keccak256(s.as_bytes()),
        }
    } else {
        tiny_keccak::keccak256(s.as_bytes())
    };
    let result = values::to_hex(&hash, true);
    if result == NULL_SHA3 {
        None
    } else {
        Some(result)
    }
}

#[wasm_bindgen]
pub fn init() {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
