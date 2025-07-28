# First, install necessary packages
import subprocess
import sys

required_packages = ['pdfminer.six', 'xlsxwriter', 'pandas', 'dateparser']
print("🔧 Installing required packages...")
subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + required_packages)

# Now import the packages
import re
import os
import pandas as pd
from collections import defaultdict
from pdfminer.high_level import extract_text
from pdfminer.layout import LAParams
from typing import Dict, List, Tuple, Optional
import dateparser
from datetime import datetime

print("✅ Packages imported successfully!")

# ========== Enhanced Configuration ==========
class Config:
    # Enhanced section patterns with more variations and translations
    SECTION_PATTERNS = {
        "bid_summary": r"(BID DETAILS|BID SUMMARY|TENDER DETAILS|बोली विवरण|बोली मांक|निविदा विवरण|TENDER INFORMATION|BID INFORMATION)",
        "important_dates": r"(BID END DATE|BID OPENING DATE|PRE-BID DATE|IMPORTANT DATES|TIMELINE|तारीख|समय|महत्वपूर्ण तिथियां|SCHEDULE)",
        "eligibility": r"(EXPERIENCE CRITERIA|ELIGIBILITY|QUALIFICATION|अनुभव|पात्रता|योग्यता|CRITERIA|REQUIREMENTS)",
        "technical_specifications": r"(TECHNICAL SPECIFICATIONS|SPECIFICATIONS|SCOPE OF WORK|तकनीकी विशिष्टियाँ|ITEM CATEGORY|BOQ|BILL OF QUANTITY)",
        "financial": r"(EMD AMOUNT|ePBG|EARNEST MONEY|बजट|COST|VALUE|वित्तीय|FINANCIAL|TENDER VALUE|CONTRACT VALUE|ESTIMATED COST)",
        "submission": r"(DOCUMENT REQUIRED FROM SELLER|DOCUMENTS|दस्तावेज़|DOCUMENTATION|SUBMISSION|REQUIRED DOCUMENTS)",
        "evaluation": r"(EVALUATION METHOD|EVALUATION CRITERIA|मूल्यांकन|RA QUALIFICATION RULE|SCORING|ASSESSMENT)",
        "preference_policy": r"(MSE|MSME|STARTUP|MAKE IN INDIA|पसंद|नीति|PREFERENCE|POLICY|RESERVED|WOMEN|SC/ST)",
        "delivery_schedule": r"(DELIVERY DAYS|DELIVERY SCHEDULE|डिलीवरी के दिन|CONSIGNEE|DELIVERY LOCATION|TIMELINE)"
    }
    
    # Enhanced and more comprehensive key field patterns
    KEY_FIELDS = {
        "Tender ID": [
            r"(?:Tender\s*(?:ID|No|Number)|BID\s*(?:NO|NUMBER)|निविदा\s*संख्या|बोली\s*मांक)[\s:：-]*([A-Za-z0-9/_-]+)",
            r"(?:Reference\s*No|Ref\s*No)[\s:：-]*([A-Za-z0-9/_-]+)",
            r"e-Tender\s*No[\s:：-]*([A-Za-z0-9/_-]+)"
        ],
        "Organization": [
            r"(?:Organization|Department|Buyer\s*Name|Ministry|क्रेता\s*का\s*नाम|संगठन)[\s:：-]*(.+?)(?:\n|$)",
            r"(?:Procuring\s*Entity|Purchaser)[\s:：-]*(.+?)(?:\n|$)",
            r"(?:Name\s*of\s*the\s*Buyer|Buyer)[\s:：-]*(.+?)(?:\n|$)"
        ],
        "Tender Value": [
            r"(?:Estimated\s*(?:Value|Cost)|EMD\s*Amount|Tender\s*Value|Contract\s*Value|Budget|बजट|अनुमानित\s*मूल्य)[\s:：-]*([₹Rs\.0-9,. ]+(?:Crore|Lakh|Lakhs|crore|lakh|lakhs)?)",
            r"(?:Total\s*Cost|Financial\s*Value)[\s:：-]*([₹Rs\.0-9,. ]+(?:Crore|Lakh|Lakhs|crore|lakh|lakhs)?)",
            r"(?:Price|Amount|Value)[\s:：-]*([₹Rs\.0-9,. ]+(?:Crore|Lakh|Lakhs|crore|lakh|lakhs)?)"
        ],
        "Bid End Date": [
            r"(?:Bid\s*End\s*Date|Last\s*Date|Closing\s*Date|बोली\s*समाप्ति\s*तिथि)[\s:：-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)?)",
            r"(?:Submission\s*Deadline|Final\s*Date)[\s:：-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)?)"
        ],
        "Bid Opening Date": [
            r"(?:Bid\s*Opening\s*Date|Opening\s*Date|बोली\s*खोलने\s*की\s*तिथि)[\s:：-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)?)",
            r"(?:Technical\s*Bid\s*Opening|Commercial\s*Bid\s*Opening)[\s:：-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)?)"
        ],
        "Pre-Bid Date": [
            r"(?:Pre-Bid\s*(?:Date|Meeting)|प्री-बिड\s*तिथि)[\s:：-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)?)",
            r"(?:Pre\s*Bid\s*Conference|Site\s*Visit)[\s:：-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)?)"
        ],
        "EMD Amount": [
            r"(?:EMD\s*Amount|Earnest\s*Money|Security\s*Deposit|बयाना\s*राशि)[\s:：-]*([₹Rs\.0-9,. ]+(?:Crore|Lakh|Lakhs|crore|lakh|lakhs)?)",
            r"(?:Bid\s*Security|Performance\s*Guarantee)[\s:：-]*([₹Rs\.0-9,. ]+(?:Crore|Lakh|Lakhs|crore|lakh|lakhs)?)"
        ],
        "Contact Person": [
            r"(?:Contact\s*Person|Officer|Nodal\s*Officer|संपर्क\s*व्यक्ति)[\s:：-]*(.+?)(?:\n|Email|Phone|$)",
            r"(?:Tender\s*Inviting\s*Authority|Authority)[\s:：-]*(.+?)(?:\n|Email|Phone|$)"
        ],
        "Email": [
            r"(?:Email|E-mail|ईमेल)[\s:：-]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})",
            r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"
        ],
        "Phone": [
            r"(?:Phone|Mobile|Contact|फ़ोन)[\s:：-]*([+]?[\d\s()-]{10,})",
            r"(?:Tel|Telephone)[\s:：-]*([+]?[\d\s()-]{10,})"
        ]
    }

# ========== Enhanced Text Processing ==========
def clean_text(text: str) -> str:
    """Clean and normalize text for better processing"""
    if not text:
        return ""
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters that might interfere
    text = re.sub(r'[^\w\s\-/:.,₹()@]', ' ', text)
    return text.strip()

def normalize_amount(amount_str: str) -> str:
    """Normalize monetary amounts for consistency"""
    if not amount_str:
        return ""
    
    # Remove extra spaces and normalize
    amount_str = re.sub(r'\s+', ' ', amount_str.strip())
    
    # Add currency symbol if missing
    if not re.search(r'[₹Rs]', amount_str):
        amount_str = '₹ ' + amount_str
    
    return amount_str

def normalize_date(date_str: str) -> str:
    """Normalize dates for consistency"""
    if not date_str:
        return ""
    
    try:
        # Try to parse the date using dateparser
        parsed_date = dateparser.parse(date_str)
        if parsed_date:
            return parsed_date.strftime("%d/%m/%Y")
    except:
        pass
    
    return date_str.strip()

# ========== Enhanced Summarizer ==========
def summarize_text(text: str, max_length: int = 300) -> str:
    """Enhanced text summarization with better sentence selection"""
    if not text:
        return ""
    
    # Clean the text
    text = clean_text(text)
    
    # Split into sentences more accurately
    sentences = re.split(r'(?<=[.?!])\s+', text.strip())
    
    # Filter out very short or meaningless sentences
    meaningful_sentences = [s for s in sentences if len(s) > 15 and not re.match(r'^\d+\.$', s.strip())]
    
    summary = []
    total_length = 0
    
    for sentence in meaningful_sentences:
        if total_length + len(sentence) > max_length:
            break
        summary.append(sentence.strip())
        total_length += len(sentence)
    
    result = '. '.join(summary)
    if total_length < len(text) * 0.8:  # If we've significantly shortened the text
        result += '...'
    
    return result

# ========== Enhanced PDF Processing ==========
class PDFProcessor:
    @staticmethod
    def extract_text_with_layout(pdf_path: str) -> str:
        """Extract text with improved layout parameters"""
        laparams = LAParams(
            line_margin=0.5, 
            char_margin=2.0, 
            word_margin=0.1, 
            boxes_flow=0.5,
            detect_vertical=True
        )
        text = extract_text(pdf_path, laparams=laparams)
        return clean_text(text)

    @staticmethod
    def detect_sections(text: str) -> Dict[str, str]:
        """Enhanced section detection with better boundary detection"""
        sections = defaultdict(str)
        current_section = "general_information"
        
        lines = text.split('\n')
        section_boundaries = []
        
        # First pass: identify section boundaries
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            for section, pattern in Config.SECTION_PATTERNS.items():
                if re.search(pattern, line, re.IGNORECASE):
                    section_boundaries.append((i, section))
                    break
        
        # Second pass: assign content to sections
        current_section = "general_information"
        for i, line in enumerate(lines):
            # Check if this line starts a new section
            for boundary_line, section in section_boundaries:
                if i == boundary_line:
                    current_section = section
                    break
            
            if line.strip():
                sections[current_section] += line + "\n"
        
        return dict(sections)

# ========== Enhanced Key Fields Extraction ==========
def extract_key_fields(text: str) -> dict:
    """Enhanced key field extraction with multiple pattern matching"""
    results = {}
    
    for field, patterns in Config.KEY_FIELDS.items():
        field_value = ""
        confidence = 0
        
        # Try each pattern for this field
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            
            for match in matches:
                captured_value = match.group(match.lastindex).strip()
                
                # Apply field-specific cleaning
                if field in ["Tender Value", "EMD Amount"]:
                    captured_value = normalize_amount(captured_value)
                elif "Date" in field:
                    captured_value = normalize_date(captured_value)
                elif field in ["Organization", "Contact Person"]:
                    # Clean organization names
                    captured_value = re.sub(r'\s+', ' ', captured_value)
                    captured_value = captured_value.split('\n')[0]  # Take first line only
                
                # Score the match based on context and completeness
                current_confidence = len(captured_value)
                if captured_value and current_confidence > confidence:
                    field_value = captured_value
                    confidence = current_confidence
        
        results[field] = field_value
    
    return results

# ========== Enhanced BOQ Extraction ==========
def extract_boq_items(text: str) -> List[Dict[str, str]]:
    """Enhanced BOQ item extraction with better parsing"""
    items = []
    lines = text.splitlines()
    current_item = {}
    
    # Enhanced patterns for BOQ items
    patterns = {
        "Item Category": r"(?:Item\s*Category|Category|Item\s*Description|Description)[\s:：]*(.+)",
        "Quantity": r"(?:Quantity|Qty|Units?)[\s:：]*([0-9,. ]+(?:\s*\w+)?)",
        "Delivery Days": r"(?:Delivery\s*Days?|Delivery\s*Period|Timeline)[\s:：]*([0-9]+ ?\w*)",
        "Consignee": r"(?:Consignee|Delivery\s*Location|Location)[\s:：]*(.+)",
        "Unit": r"(?:Unit|UOM|Measurement)[\s:：]*(\w+)",
        "Rate": r"(?:Rate|Price|Cost)[\s:：]*([₹Rs\.0-9,. ]+)",
        "Amount": r"(?:Amount|Total|Value)[\s:：]*([₹Rs\.0-9,. ]+)"
    }
    
    # Look for table-like structures
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        
        # Check if this line indicates a new item
        if re.search(r"(?:Item\s*Category|S\.?\s*No\.?|Serial)", line, re.IGNORECASE):
            if current_item and len(current_item) > 1:  # Save previous item if it has content
                items.append(current_item.copy())
                current_item = {}
        
        # Extract fields from current line
        for field, pattern in patterns.items():
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                value = match.group(1).strip()
                if field in ["Rate", "Amount"]:
                    value = normalize_amount(value)
                current_item[field] = value
    
    # Don't forget the last item
    if current_item and len(current_item) > 1:
        items.append(current_item)
    
    return items

# ========== Enhanced Date Extraction ==========
def extract_important_dates(text: str) -> List[Dict[str, str]]:
    """Extract important dates with better pattern matching"""
    dates_data = []
    
    # Enhanced date patterns
    date_patterns = {
        "Bid End Date": [
            r"(?:Bid\s*End\s*Date|Last\s*Date\s*for\s*Submission|Closing\s*Date|बोली\s*समाप्ति\s*तिथि)[\s:：-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)?)",
            r"(?:Submission\s*Deadline|Final\s*Date)[\s:：-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)?)"
        ],
        "Bid Opening Date": [
            r"(?:Bid\s*Opening\s*Date|Opening\s*Date|बोली\s*खोलने\s*की\s*तिथि)[\s:：-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)?)",
            r"(?:Technical\s*Bid\s*Opening|Price\s*Bid\s*Opening)[\s:：-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)?)"
        ],
        "Pre-Bid Date": [
            r"(?:Pre-Bid\s*(?:Date|Meeting|Conference)|प्री-बिड\s*तिथि)[\s:：-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)?)",
            r"(?:Site\s*Visit|Clarification\s*Meeting)[\s:：-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)?)"
        ],
        "Publication Date": [
            r"(?:Publication\s*Date|Published\s*on|Tender\s*Date)[\s:：-]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)?)"
        ]
    }
    
    for event_type, patterns in date_patterns.items():
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                date_str = match.group(1).strip()
                normalized_date = normalize_date(date_str)
                if normalized_date:
                    dates_data.append({
                        "Event": event_type,
                        "Date": normalized_date,
                        "Original": date_str
                    })
                    break  # Take first match for each event type
        
        if any(d["Event"] == event_type for d in dates_data):
            break  # Move to next event type if we found this one
    
    return dates_data

# ========== Enhanced Tender Analyzer ==========
class TenderAnalyzer:
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.raw_text = ""
        self.sections = {}
        self.validation_errors = []

    def validate_extracted_data(self, key_fields: dict) -> List[str]:
        """Validate extracted data and return list of potential issues"""
        errors = []
        
        # Check for missing critical fields
        critical_fields = ["Tender ID", "Organization", "Bid End Date"]
        for field in critical_fields:
            if not key_fields.get(field):
                errors.append(f"Missing critical field: {field}")
        
        # Validate date formats
        for field in ["Bid End Date", "Bid Opening Date", "Pre-Bid Date"]:
            if key_fields.get(field):
                try:
                    dateparser.parse(key_fields[field])
                except:
                    errors.append(f"Invalid date format in {field}: {key_fields[field]}")
        
        # Validate monetary amounts
        for field in ["Tender Value", "EMD Amount"]:
            if key_fields.get(field):
                if not re.search(r'[0-9]', key_fields[field]):
                    errors.append(f"Invalid amount format in {field}: {key_fields[field]}")
        
        return errors

    def process_document(self):
        """Enhanced document processing with validation"""
        print("📄 Extracting text from PDF...")
        self.raw_text = PDFProcessor.extract_text_with_layout(self.pdf_path)
        
        print("🔍 Detecting document sections...")
        self.sections = PDFProcessor.detect_sections(self.raw_text)
        
        print(f"✅ Found {len(self.sections)} sections")
        
        # Log section names for debugging
        print("Detected sections:", list(self.sections.keys()))

    def generate_excel_report(self, output_path: str):
        """Enhanced Excel report generation with validation"""
        writer = pd.ExcelWriter(output_path, engine='xlsxwriter')
        workbook = writer.book
        
        # Define formats
        wrap_format = workbook.add_format({'text_wrap': True, 'valign': 'top'})
        header_format = workbook.add_format({'bold': True, 'bg_color': '#D7E4BC', 'text_wrap': True})
        error_format = workbook.add_format({'bg_color': '#FFE6E6', 'text_wrap': True})

        # ===== Enhanced Key Fields Sheet =====
        print("📊 Generating Key Fields sheet...")
        key_fields = extract_key_fields(self.raw_text)
        
        # Validate the extracted data
        validation_errors = self.validate_extracted_data(key_fields)
        
        # Prepare key fields data with validation status
        key_fields_data = []
        for field, value in key_fields.items():
            status = "✅ OK" if value else "❌ Missing"
            if any(field in error for error in validation_errors):
                status = "⚠️ Invalid"
            
            key_fields_data.append({
                "Field": field,
                "Value": value if value else "Not Found",
                "Status": status
            })
        
        key_fields_df = pd.DataFrame(key_fields_data)
        key_fields_df.to_excel(writer, sheet_name="Key Fields", index=False)
        
        kf_ws = writer.sheets["Key Fields"]
        kf_ws.set_column('A:A', 25, header_format)
        kf_ws.set_column('B:B', 50, wrap_format)
        kf_ws.set_column('C:C', 15, wrap_format)

        # Add validation errors if any
        if validation_errors:
            error_df = pd.DataFrame([{"Validation Issues": error} for error in validation_errors])
            error_df.to_excel(writer, sheet_name="Key Fields", index=False, startrow=len(key_fields_df) + 3)
            
            error_start_row = len(key_fields_df) + 4
            for i in range(len(validation_errors)):
                kf_ws.set_row(error_start_row + i, None, error_format)

        # ===== Enhanced Overview Sheet =====
        print("📋 Generating Overview sheet...")
        overview_data = {
            "Document Property": [
                "PDF File", 
                "Total Sections", 
                "Total Characters", 
                "Processing Date",
                "Validation Status"
            ],
            "Value": [
                os.path.basename(self.pdf_path), 
                len(self.sections), 
                len(self.raw_text),
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                f"{len(validation_errors)} issues found" if validation_errors else "✅ All OK"
            ]
        }
        overview_df = pd.DataFrame(overview_data)
        overview_df.to_excel(writer, sheet_name="Overview", index=False)

        # Enhanced Section Summaries
        summary_data = []
        for section, content in self.sections.items():
            summary = summarize_text(content, 200)
            char_count = len(content)
            summary_data.append({
                "Section": section.replace('_', ' ').title(),
                "Character Count": char_count,
                "Summary": summary if summary else "No meaningful content found"
            })
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name="Overview", index=False, startrow=len(overview_df) + 2)

        ov_ws = writer.sheets['Overview']
        ov_ws.write(len(overview_df) + 1, 0, "Section Analysis", header_format)
        ov_ws.set_column('A:A', 25, wrap_format)
        ov_ws.set_column('B:B', 15, wrap_format)
        ov_ws.set_column('C:C', 80, wrap_format)

        # ===== Enhanced Important Dates Sheet =====
        print("📅 Generating Important Dates sheet...")
        all_dates = extract_important_dates(self.raw_text)
        
        if all_dates:
            dates_df = pd.DataFrame(all_dates)
            dates_df.to_excel(writer, sheet_name="Important Dates", index=False)
            
            date_ws = writer.sheets['Important Dates']
            date_ws.set_column('A:A', 25, wrap_format)
            date_ws.set_column('B:B', 20, wrap_format)
            date_ws.set_column('C:C', 25, wrap_format)

        # ===== Enhanced BOQ Items Sheet =====
        print("📦 Generating BOQ Items sheet...")
        tech_spec_content = ""
        for section_name, content in self.sections.items():
            if 'technical' in section_name.lower() or 'specification' in section_name.lower():
                tech_spec_content += content + "\n"
        
        if tech_spec_content:
            items = extract_boq_items(tech_spec_content)
            if items:
                boq_df = pd.DataFrame(items)
                boq_df.to_excel(writer, sheet_name="BOQ Items", index=False)
                
                boq_ws = writer.sheets["BOQ Items"]
                for col_num in range(len(boq_df.columns)):
                    boq_ws.set_column(col_num, col_num, 30, wrap_format)

        # ===== Enhanced Sections Sheet =====
        print("📑 Generating Sections sheet...")
        section_data = []
        for section, content in self.sections.items():
            section_data.append({
                "Section": section.replace('_', ' ').title(),
                "Word Count": len(content.split()),
                "Content": content.strip()[:5000] + "..." if len(content) > 5000 else content.strip()
            })
        
        section_df = pd.DataFrame(section_data)
        section_df.to_excel(writer, sheet_name="Sections", index=False)
        
        sec_ws = writer.sheets['Sections']
        sec_ws.set_column('A:A', 25, header_format)
        sec_ws.set_column('B:B', 15, wrap_format)
        sec_ws.set_column('C:C', 100, wrap_format)

        # ===== Full Text Sheet (unchanged) =====
        full_df = pd.DataFrame([{"Content": self.raw_text}])
        full_df.to_excel(writer, sheet_name="Full Text", index=False)
        writer.sheets['Full Text'].set_column('A:A', 120, wrap_format)

        writer.close()
        print(f"✅ Enhanced Excel report saved as: {output_path}")
        print(f"📈 Report includes {len(key_fields)} key fields, {len(self.sections)} sections")
        
        if validation_errors:
            print(f"⚠️  {len(validation_errors)} validation issues found - check the Key Fields sheet")

# ========== Usage Example ==========
def main():
    """Main function to process tender document"""
    # Example usage
    pdf_path = "path/to/your/tender.pdf"  # Replace with actual path
    output_path = "enhanced_tender_analysis.xlsx"
    
    try:
        analyzer = TenderAnalyzer(pdf_path)
        analyzer.process_document()
        analyzer.generate_excel_report(output_path)
        print("🎉 Processing completed successfully!")
        
    except Exception as e:
        print(f"❌ Error processing document: {str(e)}")

if __name__ == "__main__":
    main()