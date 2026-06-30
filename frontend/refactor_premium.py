import sys

def run():
    path = r'd:\GYAU_\frontend\src\App.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    if 'pusheen1' not in content:
        content = content.replace("import desk1 from './assets/desk1.png'", "import desk1 from './assets/desk1.png'\nimport pusheen1 from './assets/icons/pusheen1.png'\nimport cup1 from './assets/icons/cup1.png'")

    # 2. Hero Card Redesign
    old_hero_div = '''<motion.div 
              whileHover={{ scale: 1.01 }}
              className="rounded-3xl p-0 border border-white card-shadow flex flex-col md:flex-row items-end gap-6 relative overflow-hidden h-64 md:h-72"
              style={{
                background: `linear-gradient(135deg, #f5f7f2 0%, #d9efec 100%)`
              }}
            >'''
    new_hero_div = '''<motion.div 
              whileHover={{ scale: 1.01 }}
              className="rounded-[32px] p-0 border border-white card-shadow flex flex-col md:flex-row items-end gap-6 relative overflow-hidden h-64 md:h-72 bg-white/60 backdrop-blur-xl"
            >'''
    content = content.replace(old_hero_div, new_hero_div)

    # 3. Clouds opacity (20-30%)
    content = content.replace('opacity-35', 'opacity-20')
    content = content.replace('opacity-40', 'opacity-30')

    # 4. Mascot Composition
    old_mascot_composition = '''<div className="relative w-1/2 md:w-5/12 h-full flex justify-end items-end z-20 overflow-hidden pr-8 pb-4">
                {false ? (
                  <></>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={mascotState}
                      src={mascotState} 
                      alt="Gayu Mascot" 
                      className="h-[85%] object-contain relative z-0 mb-4 mr-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    />
                  </AnimatePresence>
                )}
              </div>'''
    
    new_mascot_composition = '''<div className="absolute inset-0 z-20 flex justify-between items-end px-8 pb-4 pointer-events-none">
                {/* Left: Coffee Cup */}
                <motion.img 
                  src={cup1} 
                  alt="Coffee" 
                  className="h-20 object-contain ml-4 mb-4"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                />
                
                {/* Center: Gayu */}
                <motion.img 
                  src={desk1} 
                  alt="Gayu Mascot" 
                  className="h-[120%] object-contain absolute bottom-0 left-1/2 -translate-x-1/2"
                />
                
                {/* Right: Pusheen */}
                <motion.img 
                  src={pusheen1} 
                  alt="Pusheen" 
                  className="h-24 object-contain mr-4 mb-4"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1 }}
                />
              </div>'''
    content = content.replace(old_mascot_composition, new_mascot_composition)

    # 5. Buttons & Glows
    content = content.replace('className="bg-accent-primary text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-emerald-500 transition-colors shadow-sm"', 'className="bg-[#d9efec] text-emerald-700 border border-[#ecf0d0] px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-[#cbe8e4] transition-all glow-primary"')
    
    # 6. Sidebar active item gradient and glow
    content = content.replace("? 'bg-accent-primary text-white shadow-md shadow-emerald-200'", "? 'bg-gradient-to-r from-[#d9efec]/60 to-[#ecf0d0]/60 text-emerald-800 glow-primary border border-transparent'")

    # 7. Typography softening
    content = content.replace('font-bold', 'font-semibold')
    # Except for Gayu's greeting maybe, but font-semibold is fine for everything in a soft theme.
    content = content.replace('text-text-dark/80', 'text-gray-400')
    
    # 8. Padding increase in main cards (p-6 to p-8)
    content = content.replace('p-6', 'p-8')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    run()
