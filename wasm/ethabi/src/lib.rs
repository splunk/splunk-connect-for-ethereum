mod datatypes;
mod sig;
mod values;

#[macro_use]
extern crate serde_derive;

use ethabi::param_type::ParamType;
use ethabi::{decode, Address};
use serde::Serialize;
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

#[derive(Serialize, Debug)]
pub struct DecodedParameters(Vec<Value>);

#[derive(Serialize, Debug)]
#[serde(tag = "t", content = "c")]
pub enum JsResult<T> {
    Ok(T),
    Err(String),
}

fn serialize_js_result<T: Serialize>(result: &JsResult<T>) -> JsValue {
    JsValue::from_serde(result).expect("Failed to serialize JsResult")
}

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
pub fn abi_decode_parameters(data: &[u8], type_list: Box<[JsValue]>) -> JsValue {
    serialize_js_result(
        &match datatypes::parse_param_type(&encode_type_list(type_list)) {
            Ok(ParamType::Tuple(params)) => {
                let p = params
                    .iter()
                    .map(|p| *(*p).clone())
                    .collect::<Vec<ParamType>>();
                match decode(&p[..], data) {
                    Ok(tokens) => JsResult::Ok(DecodedParameters(
                        tokens.iter().map(|t| token_to_value(&t)).collect(),
                    )),
                    Err(err) => JsResult::Err(format!("Failed to decode: {:?}", err)),
                }
            }
            Err(e) => JsResult::Err(format!("Failed to decode: {:?}", e)),
            _ => JsResult::Err(format!("Unable to parse parameter list")),
        },
    )
}

#[wasm_bindgen]
pub fn parse_function_signature(signature: String) -> JsValue {
    serialize_js_result(&match sig::parse_signature(&signature, false) {
        Ok(item) => JsResult::Ok(item),
        Err(msg) => JsResult::Err(msg),
    })
}

#[wasm_bindgen]
pub fn parse_event_signature(signature: String) -> JsValue {
    serialize_js_result(&match sig::parse_signature(&signature, true) {
        Ok(item) => JsResult::Ok(item),
        Err(msg) => JsResult::Err(msg),
    })
}

#[wasm_bindgen]
pub fn is_valid_param_type(type_str: String) -> bool {
    match datatypes::parse_param_type(&type_str) {
        Ok(_) => true,
        Err(_) => false,
    }
}

#[wasm_bindgen]
pub fn is_array_type(data_type: String) -> JsValue {
    serialize_js_result(&match datatypes::parse_param_type(&data_type) {
        Ok(ParamType::Array(_)) => JsResult::Ok(true),
        Ok(ParamType::FixedArray(_, _)) => JsResult::Ok(true),
        Ok(_) => JsResult::Ok(false),
        Err(e) => JsResult::Err(format!("{}", e)),
    })
}

#[derive(Serialize, Debug)]
pub struct ParamDataSize {
    length: usize,
    exact: bool,
}

#[wasm_bindgen]
pub fn get_data_size(type_str: String) -> JsValue {
    serialize_js_result(&match datatypes::parse_param_type(&type_str) {
        Ok(t) => match datatypes::get_data_size(&t) {
            (size, exact) => JsResult::Ok(ParamDataSize {
                length: size,
                exact: exact,
            }),
        },
        Err(err) => JsResult::Err(err),
    })
}

#[wasm_bindgen]
pub fn to_checksum_address(address_str: String) -> JsValue {
    serialize_js_result(&match to_checksum_address_internal(address_str) {
        Ok(v) => JsResult::Ok(v),
        Err(e) => JsResult::Err(e),
    })
}

pub fn to_checksum_address_internal(address_str: String) -> Result<String, String> {
    if !address_str.starts_with("0x") {
        return Err(format!(
            "Invalid address {:?} (expected \"0x\" prefix)",
            address_str
        ));
    }
    let decoded = match values::from_hex(&address_str) {
        Ok(v) => Ok(v),
        Err(_) => Err(format!("Invalid address {:?}", address_str)),
    }?;
    if decoded.len() != 20 {
        return Err(format!("Invalid size of address {}", address_str));
    }
    let address: Address = Address::from_slice(&decoded);
    Ok(values::to_checksum(&address))
}

const NULL_SHA3: &'static str =
    "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";

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
