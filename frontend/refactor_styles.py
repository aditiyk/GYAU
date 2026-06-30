import sys

def run():
    path = r'd:\GYAU_\frontend\src\App.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace borders
    content = content.replace('border-gray-150', 'border-[#ecf0d0]')
    content = content.replace('border-gray-100', 'border-[#ecf0d0]')
    content = content.replace('border-gray-200', 'border-[#ecf0d0]')
    
    # Remove Tsundere Assistant
    content = content.replace('<span className="bg-accent-pink/20 text-accent-pink px-3 py-1 rounded-full text-xs font-bold shadow-sm">Tsundere Assistant</span>', '')
    
    # Remove floating icons
    content = content.replace('<img src={cupIcon} alt="cup" className="w-10 h-10 opacity-70" />', '')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    run()
