"""Anti-Criminal Intent and Law-Evasion Guardrails for NyayaAI.

This module inspects queries to ensure NyayaAI is NEVER used to facilitate,
plan, or optimize criminal activities, evade law enforcement, tamper with evidence,
or exploit loopholes from a perpetrator's perspective.
"""

import logging
import re
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Patterns indicating malicious execution, evasion, witness tampering, or evidence destruction
_MALICIOUS_INTENT_PATTERNS = [
    # Evasion & escaping police / arrest
    r"\b(how (to|can I|do I) (escape|evade|dodge|avoid|run away from) (the )?(arrest|police|custody|warrant|law))\b",
    r"\b(how (to|can I|do I) (hide|conceal|destroy|delete|wipe) (the )?(evidence|proof|(electronic|digital) (evidence|records?)|cctv|weapon|corpse|body))\b",
    r"\b(how (to|can I|do I) (threaten|intimidate|blackmail|silence|harm|kill) (a|an|the)? ?(witness|victim|complainant|informant|police))\b",
    r"\b(how (to|can I|do I) (fake|fabricate|forge|tamper with) (a|an|the)? ?(alibi|evidence|documents?|records?|affidavit))\b",
    
    # Planning / optimizing criminal offences
    r"\b(how (to|can I|do I) (commit|execute|carry out|plan) (a|an|the)? ?(extortion|murder|rape|theft|robbery|dacoity|cyber crime|fraud|scam))\b",
    r"\b(how (to|can I|do I) (extort|threaten|blackmail|steal|cheat|defraud) (someone|a person|people|money) without (getting caught|trace|proof|evidence|police knowing))\b",
    r"\b(how (to|can I|do I) (launder|clean|hide) (stolen|black|extorted) money)\b",
    
    # Exploiting legal loopholes to commit crimes
    r"\b(loophole(s)? to (commit|escape|bypass) (a|an|the)? ?(crime|punishment|penalty|law|offence))\b",
    r"\b(best way to (kill|harm|threaten|extort|rob) (someone|anyone))\b",
    r"\b(destroy .*evidence so .*cannot trace)\b",
]

_COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in _MALICIOUS_INTENT_PATTERNS]


def inspect_criminal_intent(query: str) -> Tuple[bool, Optional[str]]:
    """Evaluates whether a user query exhibits criminal planning, evasion, or witness/evidence tampering intent.
    
    Args:
        query: User input prompt or situation.
        
    Returns:
        (is_blocked, violation_reason)
    """
    clean_q = query.strip()

    # Rule 1: Heuristic Regex Matching
    for pattern in _COMPILED_PATTERNS:
        match = pattern.search(clean_q)
        if match:
            reason = f"Query indicates potential criminal facilitation, evidence tampering, or law evasion: '{match.group(0)}'"
            logger.warning(f"Guardrail Blocked: {reason}")
            return True, reason

    # Rule 2: Multi-condition heuristic for covert crime execution
    lower_q = clean_q.lower()
    has_crime_action = any(w in lower_q for w in ["kill", "extort", "blackmail", "threaten", "tamper", "destroy evidence", "fake alibi"])
    has_evasion = any(w in lower_q for w in ["without getting caught", "without police knowing", "leave no trace", "avoid arrest", "escape liability"])
    
    if has_crime_action and has_evasion:
        reason = "Query requests assistance in executing an unlawful act while attempting to avoid law enforcement detection."
        logger.warning(f"Guardrail Blocked: {reason}")
        return True, reason

    return False, None


def generate_guardrail_refusal_response(query: str, violation_reason: str) -> Dict[str, object]:
    """Generates an authoritative statutory refusal and legal consequence warning."""
    refusal_answer = (
        "### ⚠️ NyayaAI Safety & Anti-Criminality Refusal Notice\n\n"
        "NyayaAI operates under strict Indian legal compliance and ethical AI guardrails. "
        "**NyayaAI does NOT assist in planning, executing, facilitating, or concealing criminal offences, "
        "nor does it provide guidance on evading law enforcement or tampering with evidence.**\n\n"
        "### Applicable Statutory Consequences under Indian Criminal Law:\n"
        "1. **Offence of Criminal Intimidation / Extortion / Bodily Harm (BNS, 2023)**: "
        "Attempting, abetting, or executing criminal acts is severely punishable with rigorous imprisonment and non-bailable warrants.\n"
        "2. **Destruction of Evidence / Fabricating False Evidence (BNS, 2023 / BSA, 2023)**: "
        "Causing disappearance of evidence or giving false information to screen an offender is an independent punishable offence.\n"
        "3. **Powers of Arrest & Investigation (BNSS, 2023)**: "
        "Police officers possess statutory powers under Section 35 and Section 173 of BNSS to effect arrest without warrant and seize digital records/devices for forensic analysis.\n\n"
        "### What You Can Do Legally:\n"
        "If you are involved in a legal dispute, you must seek legitimate legal representation through a licensed advocate "
        "registered with the Bar Council of India or approach your local Police Station / DLSA (District Legal Services Authority) for lawful remedies."
    )

    return {
        "question": query,
        "answer": refusal_answer,
        "relevant_provisions": [
            {
                "act": "Bharatiya Nyaya Sanhita, 2023 (BNS)",
                "section_or_topic": "Abetment, Criminal Conspiracy & Destruction of Evidence",
                "description": "Criminal liability for planning, abetting, or attempting to conceal offences.",
                "relevance_reason": "Statutory warning regarding the illegality of criminal execution.",
            }
        ],
        "why_they_may_apply": "Under BNS and BNSS, planning or attempting to screen offenders constitutes a cognizable criminal liability.",
        "additional_facts_needed": [
            "NyayaAI will not provide tactical assistance for illegal activities."
        ],
        "sources": [],
        "confidence": "HIGH",
        "is_guardrail_blocked": True,
        "disclaimer": "DISCLAIMER: NyayaAI strictly upholds the rule of law. It will never provide instructions to commit crimes or evade legal processes.",
    }
