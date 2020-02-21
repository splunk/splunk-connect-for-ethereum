use ethabi::token::Token;
use ethabi::Uint;
use primitive_types::U256;
use std::char;

#[derive(Serialize, Debug)]
#[serde(untagged)]
pub enum Value {
    STRING(String),
    NUMBER(f64),
    BOOLEAN(bool),
    ARRAY(Vec<Value>),
    NULL,
}

static MAX_SAFE_INT: Uint = U256([9007199254740991, 0, 0, 0]);

fn to_hex(bytes: &[u8], prefix: bool) -> String {
    let mut res = String::with_capacity((if prefix { 2 } else { 0 }) + bytes.len() * 2);
    if prefix {
        res.push_str("0x");
    }
    for b in bytes {
        res.push(char::from_digit(((b & 0xF0) >> 4) as u32, 16).unwrap());
        res.push(char::from_digit((b & 0xF) as u32, 16).unwrap());
    }
    res
}

// fn to_checksum(addr: &Address) -> String {
//     let addr_string = to_hex(addr.as_bytes(), false);
//     let hash_str = to_hex(&tiny_keccak::keccak256(addr_string.as_bytes()), false);
//     let mut result = "0x".to_string();
//     for (i, c) in addr_string.chars().enumerate() {
//         let n = hash_str
//             .chars()
//             .nth(i)
//             .expect("hash char not found")
//             .to_digit(16)
//             .expect("failed to convert hash char to i32");
//         if n > 7 {
//             let u = match c {
//                 'a' => 'A',
//                 'b' => 'B',
//                 'c' => 'C',
//                 'd' => 'D',
//                 'e' => 'E',
//                 'f' => 'F',
//                 other => other,
//             };
//             result.push(u);
//         } else {
//             result.push(c);
//         }
//     }
//     return result;
// }

fn uint_to_value(n: &Uint) -> Value {
    if n > &MAX_SAFE_INT {
        Value::STRING(n.to_string())
    } else {
        match n.to_string().parse::<f64>() {
            Ok(v) => Value::NUMBER(v),
            Err(_) => Value::STRING(n.to_string()),
        }
    }
}

pub fn token_to_value(t: &Token) -> Value {
    match t {
        Token::Address(addr) => Value::STRING(to_hex(addr.as_bytes(), true)),
        Token::Bytes(b) => {
            if b.len() > 0 {
                Value::STRING(to_hex(b, true))
            } else {
                Value::NULL
            }
        }
        Token::FixedBytes(b) => {
            if b.len() > 0 {
                Value::STRING(to_hex(b, true))
            } else {
                Value::NULL
            }
        }
        Token::Uint(n) => uint_to_value(n),
        Token::Int(n) => uint_to_value(n),
        Token::Bool(b) => Value::BOOLEAN(*b),
        Token::String(s) => Value::STRING(s.clone()),
        Token::Array(t) => Value::ARRAY(t.iter().map(|e| token_to_value(e)).collect()),
        Token::FixedArray(t) => Value::ARRAY(t.iter().map(|e| token_to_value(e)).collect()),
        Token::Tuple(t) => Value::ARRAY(t.iter().map(|e| token_to_value(e)).collect()),
    }
}
