import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(cors(), express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the precise schema based on your sample
// const responseSchema = {
//   type: SchemaType.OBJECT,
//   properties: {
//     rules: {
//       type: SchemaType.ARRAY,
//       items: {
//         type: SchemaType.OBJECT,
//         properties: {
//           id: { type: SchemaType.STRING },
//           rule_name: { type: SchemaType.STRING },
//           rule_type: { type: SchemaType.STRING },
//           node_type: { type: SchemaType.STRING },
//           rule_versions: {
//             type: SchemaType.ARRAY,
//             items: {
//               type: SchemaType.OBJECT,
//               properties: {
//                 version: { type: SchemaType.STRING },
//                 rule_expression: {
//                   type: SchemaType.OBJECT,
//                   properties: {
//                     rule_expression: {
//                       type: SchemaType.OBJECT,
//                       properties: {
//                         rows: { type: SchemaType.ARRAY, items: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { id: { type: SchemaType.STRING }, value: { type: SchemaType.STRING }, operator: { type: SchemaType.OBJECT, properties: { id: { type: SchemaType.NUMBER }, icon: { type: SchemaType.STRING }, name: { type: SchemaType.STRING } } } } } } },
//                         headers: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { id: { type: SchemaType.STRING }, type: { type: SchemaType.STRING }, header: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING }, dataType: { type: SchemaType.STRING } } } } } },
//                         defaultRow: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { id: { type: SchemaType.STRING }, value: { type: SchemaType.STRING }, operator: { type: SchemaType.OBJECT, properties: { id: { type: SchemaType.NUMBER }, icon: { type: SchemaType.STRING } } } } } }
//                       }
//                     }
//                   }
//                 },
//                 input_json_schema: { type: SchemaType.OBJECT, properties: { type: { type: SchemaType.STRING }, properties: { type: SchemaType.OBJECT } } },
//                 output_json_schema: { type: SchemaType.OBJECT, properties: { type: { type: SchemaType.STRING }, properties: { type: SchemaType.OBJECT } } }
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// };
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    rules: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          rule_name: { type: SchemaType.STRING },
          rule_type: { type: SchemaType.STRING },
          node_type: { type: SchemaType.STRING },
          rule_versions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                version: { type: SchemaType.STRING },
                rule_expression: {
                  type: SchemaType.OBJECT,
                  properties: {
                    rule_expression: {
                      type: SchemaType.OBJECT,
                      properties: {
                        rows: { 
                          type: SchemaType.ARRAY, 
                          items: { 
                            type: SchemaType.ARRAY, 
                            items: { 
                              type: SchemaType.OBJECT, 
                              properties: { 
                                id: { type: SchemaType.STRING }, 
                                value: { type: SchemaType.STRING }, 
                                operator: { 
                                  type: SchemaType.OBJECT, 
                                  properties: { 
                                    id: { type: SchemaType.NUMBER }, 
                                    icon: { type: SchemaType.STRING }, 
                                    name: { type: SchemaType.STRING } 
                                  } 
                                } 
                              } 
                            } 
                          } 
                        },
                        headers: { 
                          type: SchemaType.ARRAY, 
                          items: { 
                            type: SchemaType.OBJECT, 
                            properties: { 
                              id: { type: SchemaType.STRING }, 
                              type: { type: SchemaType.STRING }, 
                              header: { 
                                type: SchemaType.OBJECT, 
                                properties: { path: { type: SchemaType.STRING }, dataType: { type: SchemaType.STRING } } 
                              } 
                            } 
                          } 
                        },
                        defaultRow: { 
                          type: SchemaType.ARRAY, 
                          items: { 
                            type: SchemaType.OBJECT, 
                            properties: { 
                              id: { type: SchemaType.STRING }, 
                              value: { type: SchemaType.STRING }, 
                              operator: { 
                                type: SchemaType.OBJECT, 
                                properties: { id: { type: SchemaType.NUMBER }, icon: { type: SchemaType.STRING } } 
                              } 
                            } 
                          } 
                        }
                      }
                    }
                  }
                },
                // ✅ FIXED: Added properties to satisfy the 'non-empty' requirement
                input_json_schema: { 
                  type: SchemaType.OBJECT, 
                  properties: { 
                    type: { type: SchemaType.STRING },
                    properties: { 
                      type: SchemaType.OBJECT,
                      properties: {
                        field: { 
                          type: SchemaType.OBJECT, 
                          properties: { type: { type: SchemaType.STRING }, project: { type: SchemaType.BOOLEAN } } 
                        }
                      }
                    } 
                  } 
                },
                output_json_schema: { 
                  type: SchemaType.OBJECT, 
                  properties: { 
                    type: { type: SchemaType.STRING },
                    properties: { 
                      type: SchemaType.OBJECT,
                      properties: {
                        field: { 
                          type: SchemaType.OBJECT, 
                          properties: { type: { type: SchemaType.STRING }, project: { type: SchemaType.BOOLEAN } } 
                        }
                      }
                    } 
                  } 
                }
              }
            }
          }
        }
      }
    }
  }
};

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: responseSchema 
    }
});

const SYSTEM_PROMPT = `
You are a Decision Table Architect. Convert the user request into a Decerto-compatible JSON.
1. Use UUIDs for all "id" fields.
2. Operator Mapping: '=' is 1, 'any' is 3, '>' is 5, '<' is 7.
3. Nest the table data inside rule_versions[0].rule_expression.rule_expression.
4. Set rule_type to "DECISION_TABLE" and node_type to "step".
`;

app.post("/api/generate-rule", async (req, res) => {
  try {
    const { prompt } = req.body;
    const result = await model.generateContent(`${SYSTEM_PROMPT}\nUser Request: ${prompt}`);
    res.json({ success: true, data: JSON.parse(result.response.text()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("✅ Backend running on http://localhost:3000"));
 