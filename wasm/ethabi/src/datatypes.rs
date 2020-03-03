use ethabi::param_type::{ParamType, Reader};

pub fn is_valid_param_type(param_type: &ParamType) -> bool {
    use ParamType::*;
    match param_type.clone() {
        Tuple(components) => components
            .iter()
            .all(|c| is_valid_param_type(&*(*c).clone())),
        Int(bits) => bits > 0 && bits <= 256 && bits % 8 == 0,
        Uint(bits) => bits > 0 && bits <= 256 && bits % 8 == 0,
        FixedBytes(bytes) => bytes > 0 && bytes <= 32,
        FixedArray(el, n) => n > 0 && is_valid_param_type(&*el),
        Array(el) => match *el {
            ParamType::String | Bytes => false,
            _ => is_valid_param_type(&*el),
        },
        _ => true,
    }
}

pub fn parse_param_type(type_str: &String) -> Result<ParamType, String> {
    match Reader::read(type_str.as_str()) {
        Ok(t) => {
            if is_valid_param_type(&t) {
                Ok(t)
            } else {
                Err(format!("Invalid type: {}", type_str))
            }
        }
        Err(e) => Err(format!("{}", e)),
    }
}

// #[derive(Serialize, Debug)]
// #[serde(rename_all = "camelCase")]
// pub struct ArrayTypeInfo {
//     element_type: String,
//     dynamic: bool,
//     size: usize,
// }

// pub fn parse_array_type(type_str: &String) -> Result<ArrayTypeInfo, String> {
//     match parse_param_type(type_str) {
//         Ok(ParamType::Array(el)) => Ok(ArrayTypeInfo {
//             element_type: format!("{}", el),
//             dynamic: true,
//             size: 0,
//         }),
//         Ok(ParamType::FixedArray(el, n)) => Ok(ArrayTypeInfo {
//             element_type: format!("{}", el),
//             dynamic: false,
//             size: n,
//         }),
//         Ok(_) => Err(format!("Param type {} is not an array type", type_str)),
//         Err(e) => Err(e),
//     }
// }

/// Get (minimum) size of encoded data for a given parameter type
pub fn get_data_size(param: &ParamType) -> (usize, bool) {
    match param {
        ParamType::Bool | ParamType::Int(_) | ParamType::Uint(_) | ParamType::Address => (32, true),
        ParamType::String | ParamType::Bytes => (64, false),
        ParamType::FixedBytes(_) => (32, true),
        ParamType::FixedArray(inner, size) => match get_data_size(inner) {
            (inner_size, exact) => (inner_size * size, exact),
        },
        ParamType::Array(_) => (64, false),
        ParamType::Tuple(inner) => inner
            .iter()
            .map(|t| get_data_size(t))
            .fold((0, true), |(size, exact), (cur_size, cur_exact)| {
                (size + cur_size, exact && cur_exact)
            }),
    }
}
