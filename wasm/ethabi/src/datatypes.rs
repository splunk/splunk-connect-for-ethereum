use ethabi::param_type::ParamType;
use ethabi::Error;

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
        Array(el) => is_valid_param_type(&*el),
        _ => true,
    }
}

pub fn parse_param_type(type_str: &String) -> Result<ParamType, String> {
    match read(type_str.as_str()) {
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

pub fn tokenize(args_str: &str) -> Result<Vec<&str>, Error> {
    let mut cur_start = 0;
    let mut paren_depth = 0;
    let mut tokens = Vec::new();

    for (i, ch) in args_str.chars().enumerate() {
        match ch {
            '(' => {
                paren_depth += 1;
            }
            ')' => {
                paren_depth -= 1;
                if paren_depth < 0 {
                    return Err(Error::Other(format!("Unbalanced parenthesis")));
                }
            }
            ',' => {
                if paren_depth == 0 {
                    let t = &args_str[cur_start..i];
                    tokens.push(t);
                    cur_start = i + 1;
                }
            }
            _ => {}
        };
    }
    if paren_depth != 0 {
        return Err(Error::Other(String::from("Unbalanced parenthesis")));
    }
    if cur_start < args_str.len() {
        let i = args_str.len();
        let t = &args_str[cur_start..i];
        tokens.push(t);
    } else if cur_start > 0 {
        return Err(Error::Other(String::from(
            "Unexpected end of argument list",
        )));
    }
    Ok(tokens)
}

pub fn read(name: &str) -> Result<ParamType, Error> {
    match name.chars().last() {
        // check if it is a tuple
        Some(')') => {
            if !name.starts_with('(') {
                return Err(Error::InvalidName(name.to_owned()));
            };

            let components = tokenize(&name[1..(name.len() - 1)])?;
            let subtypes = components
                .iter()
                .map(|c| match read(c) {
                    Ok(p) => Ok(Box::new(p)),
                    Err(e) => Err(e),
                })
                .collect::<Result<Vec<Box<ParamType>>, Error>>()?;

            return Ok(ParamType::Tuple(subtypes));
        }
        // check if it is a fixed or dynamic array.
        Some(']') => {
            // take number part
            let num: String = name
                .chars()
                .rev()
                .skip(1)
                .take_while(|c| *c != '[')
                .collect::<String>()
                .chars()
                .rev()
                .collect();

            let count = name.chars().count();
            if num.is_empty() {
                // we already know it's a dynamic array!
                let subtype = read(&name[..count - 2])?;
                return Ok(ParamType::Array(Box::new(subtype)));
            } else {
                // it's a fixed array.
                let len = usize::from_str_radix(&num, 10)?;
                let subtype = read(&name[..count - num.len() - 2])?;
                return Ok(ParamType::FixedArray(Box::new(subtype), len));
            }
        }
        _ => (),
    }

    let result = match name {
        "address" => ParamType::Address,
        "bytes" => ParamType::Bytes,
        "bool" => ParamType::Bool,
        "string" => ParamType::String,
        "int" => ParamType::Int(256),
        "tuple" => ParamType::Tuple(vec![]),
        "uint" => ParamType::Uint(256),
        s if s.starts_with("int") => {
            let len = usize::from_str_radix(&s[3..], 10)?;
            ParamType::Int(len)
        }
        s if s.starts_with("uint") => {
            let len = usize::from_str_radix(&s[4..], 10)?;
            ParamType::Uint(len)
        }
        s if s.starts_with("bytes") => {
            let len = usize::from_str_radix(&s[5..], 10)?;
            ParamType::FixedBytes(len)
        }
        _ => {
            return Err(Error::InvalidName(name.to_owned()));
        }
    };

    Ok(result)
}

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

#[cfg(test)]
mod tests {
    use super::parse_param_type;
    use crate::ParamType;

    #[test]
    fn test_parse_param_type() {
        assert!(parse_param_type(&String::from("string[]")).is_ok());
        assert_eq!(
            parse_param_type(&"(uint8,bool)".to_string()).unwrap(),
            ParamType::Tuple(vec![
                Box::new(ParamType::Uint(8)),
                Box::new(ParamType::Bool),
            ])
        );
        assert!(
            parse_param_type(&"((address,((uint256,address),(uint8,bytes32,bytes32)),(uint256,uint256,address,(uint8,bytes32,bytes32)),(uint256,uint256,address,(uint8,bytes32,bytes32)),(address,address,uint256,address,uint256,address,address,uint256,address,uint256,address,uint256,address,uint256,uint256,address,bytes32,uint256,uint256,(uint8,bytes32,bytes32),(uint8,bytes32,bytes32),(uint8,bytes32,bytes32))))".to_string()).is_ok()
        );
        assert!(
            parse_param_type(&"(string,string,string,string,string,uint256,uint256,uint256,uint256,uint256,uint256,uint256,string,string,uint256,string[],uint256,string[],(string,string,string))".to_string()).is_ok()
        );
    }
}
