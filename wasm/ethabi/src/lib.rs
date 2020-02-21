mod values;

#[macro_use]
extern crate serde_derive;

use ethabi::decode;
use ethabi::param_type::{ParamType, Reader};
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
    match Reader::read(encode_type_list(type_list).as_str()) {
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
