from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import openai
from PIL import Image
import os
import requests
from io import BytesIO
from dotenv import load_dotenv
import concurrent.futures
from functools import lru_cache
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

os.makedirs('generated_recipes', exist_ok=True)


load_dotenv()

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:5173", 
            "https://*.awsapprunner.com",  
            "https://rqddneerpm.ap-south-1.awsapprunner.com/" 
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})



# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

class RecipeGenerator:
    def __init__(self):
        self.image_folder = 'generated_recipes'
        os.makedirs(self.image_folder, exist_ok=True)

    @lru_cache(maxsize=128)
    def _validate_ingredients_cached(self, ingredients_tuple):
        """
        Cached version of ingredient validation
        """
        ingredients_list = list(ingredients_tuple)
        # Use GPT to validate ingredients and get suggestions
        prompt = f"""Analyze these ingredients and provide validation info:
        Ingredients: {', '.join(ingredients_list)}
        
        Please check:
        1. Are these common cooking ingredients?
        2. Are there any potentially unsafe combinations?
        3. What type of dishes could these ingredients make?
        
        Format response as a brief summary."""

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a chef validating cooking ingredients."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        return response.choices[0].message.content.strip()

    def validate_ingredients(self, ingredients):
        """
        Validates the ingredients list and returns validation info with caching
        """
        try:
            if not ingredients or len(ingredients) < 2:
                return None
            
            # Convert list to tuple for caching (lists are not hashable)
            ingredients_tuple = tuple(sorted(ingredients))
            return self._validate_ingredients_cached(ingredients_tuple)
            
        except Exception as e:
            print(f"Error validating ingredients: {str(e)}")
            return None

    def generate_recipe_options(self, ingredients):
        """
        Generates recipe options based on the provided ingredients
        """
        try:
            prompt = f"""Create 6 unique recipe ideas using these ingredients: {', '.join(ingredients)}
            
            For each recipe provide:
            1. A creative name
            2. A brief description
            3. A list of any additional key ingredients needed
            4. Estimated cooking time
            5. Difficulty level (Easy, Medium, Hard)
            
            Format as JSON:
            [
                {{
                    "name": "Recipe Name",
                    "description": "Brief description",
                    "additionalIngredients": ["ingredient1", "ingredient2"],
                    "timeEstimate": "20-30 mins",
                    "difficulty": "Easy"
                }},
                ...
            ]"""

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a creative international chef generating diverse and exciting recipe ideas."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8  # Increased for more creativity
            )

            # Parse the response to extract recipes
            import json
            recipes_text = response.choices[0].message.content.strip()
            recipes = json.loads(recipes_text)
            
            # Ensure we have exactly 6 recipes
            if len(recipes) > 6:
                recipes = recipes[:6]
            elif len(recipes) < 6:
                print("Warning: Generated fewer than 6 recipes")
                
            return recipes

        except Exception as e:
            print(f"Error generating recipe options: {str(e)}")
            return None

    def generate_detailed_recipe(self, recipe_name, ingredients):
        try:
            prompt = f"""Create a detailed recipe for: {recipe_name}
            Using these ingredients: {', '.join(ingredients)}

            First, analyze the recipe and determine:
            1. Realistic cooking time based on preparation and cooking steps
            2. Appropriate number of servings based on ingredient quantities
            3. Difficulty level (Easy, Medium, Hard)

            Then format the recipe as follows:

            Cooking Time: [Calculate exact time in minutes based on all steps]
            Servings: [Calculate based on ingredient quantities]
            Difficulty: [Based on complexity of steps and techniques]

            Ingredients:
            - [List each ingredient with exact measurements]

            Instructions:
            1. [First preparation step with specific time]
            2. [Second preparation step with specific time]
            3. [Continue with detailed steps and timing...]

            Chef's Tips:
            - [Include 2-3 helpful cooking tips]
            - [Storage recommendations]
            - [Best serving suggestions]

            Nutritional Information (per serving):
            - Calories
            - Protein
            - Carbs
            - Fat

            Please ensure cooking time and servings are realistic and specific to this recipe.
            """

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system", 
                        "content": """You are a professional chef creating precise recipes. 
                        Always calculate exact cooking times based on preparation and cooking steps.
                        Determine realistic serving sizes based on ingredient quantities.
                        Never use generic times or serving sizes."""
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"Error generating detailed recipe: {str(e)}")
            return None

    def get_nutrition_analysis(self, recipe_name, ingredients):
        try:
            prompt = f"""Provide comprehensive nutritional analysis for {recipe_name} with ingredients: {', '.join(ingredients)}

            Include:
            1. Complete macronutrient breakdown
            2. Detailed micronutrient content
            3. Caloric content and distribution
            4. Daily value percentages
            5. Health benefits and considerations
            6. Glycemic index estimate
            7. Potential allergens
            8. Suggestions for nutritional improvements
            """

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a certified nutritionist providing detailed and accurate nutritional analysis."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error generating nutrition analysis: {str(e)}")
            return None

    def create_recipe_image(self, recipe_name):
        """
        Creates an image for the recipe using DALL-E and saves it
        """
        try:
            # Ensure the image folder exists with proper permissions
            if not os.path.exists(self.image_folder):
                os.makedirs(self.image_folder, mode=0o755, exist_ok=True)
            
            # Generate image prompt
            prompt = f"A professional food photography style image of {recipe_name}, on a beautiful plate with garnish, soft lighting, high resolution"
            
            # Create image using DALL-E
            response = openai.Image.create(
                prompt=prompt,
                n=1,
                size="512x512"
            )
            
            # Get image URL from response
            image_url = response['data'][0]['url']
            
            # Download the image
            image_response = requests.get(image_url)
            if image_response.status_code != 200:
                raise Exception("Failed to download image")
            
            # Create a safe filename from recipe name
            safe_filename = recipe_name.lower().replace(' ', '_').replace("'", "").replace('"', '')
            safe_filename = ''.join(c for c in safe_filename if c.isalnum() or c == '_')
            safe_filename = safe_filename.replace('-', '_')  # Replace hyphens with underscores
            filename = f"{safe_filename}.png"
            
            # Save the image with proper permissions
            image_path = os.path.join(self.image_folder, filename)
            with open(image_path, 'wb') as f:
                f.write(image_response.content)
            
            # Set proper file permissions
            os.chmod(image_path, 0o644)
            
            # Clean up old images
            self.cleanup_old_images()
            
            # Return the URL path for the image
            return f'/images/{filename}'
            
        except Exception as e:
            print(f"Error creating recipe image: {str(e)}")
            return None

    def cleanup_old_images(self, max_images=50):
        """
        Removes old images when the folder exceeds max_images
        """
        try:
            images = [f for f in os.listdir(self.image_folder) if f.endswith('.png')]
            if len(images) > max_images:
                images.sort(key=lambda x: os.path.getctime(os.path.join(self.image_folder, x)))
                for old_image in images[:(len(images) - max_images)]:
                    os.remove(os.path.join(self.image_folder, old_image))
        except Exception as e:
            print(f"Error cleaning up old images: {str(e)}")


recipe_generator = RecipeGenerator()

@app.route('/api/generate-recipes', methods=['POST', 'OPTIONS'])
def generate_recipes():
    if request.method == "OPTIONS":
        return "", 200
        
    try:
        data = request.json
        ingredients = data.get('ingredients', [])
        
        if not ingredients:
            return jsonify({'error': 'No ingredients provided'}), 400
        
       
        with concurrent.futures.ThreadPoolExecutor() as executor:
            validation_future = executor.submit(recipe_generator.validate_ingredients, ingredients)
            recipes_future = executor.submit(recipe_generator.generate_recipe_options, ingredients)
            
            validation_result = validation_future.result()
            recipes = recipes_future.result()
        
        if validation_result and recipes:
            # Create a thread pool for generating images in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
               
                future_to_recipe = {
                    executor.submit(recipe_generator.create_recipe_image, recipe['name']): recipe 
                    for recipe in recipes
                }
                
                
                for future in concurrent.futures.as_completed(future_to_recipe):
                    recipe = future_to_recipe[future]
                    try:
                        image_url = future.result()
                        if image_url:
                            recipe['imageUrl'] = f'https://inkqxdx9em.ap-southeast-1.awsapprunner.com{image_url}'
                        recipe['validationInfo'] = validation_result
                    except Exception as e:
                        print(f"Error generating image for {recipe['name']}: {str(e)}")
                        recipe['imageUrl'] = None
            
            return jsonify({'recipes': recipes})
        else:
            return jsonify({'error': 'Failed to validate ingredients or generate recipes'}), 400

    except Exception as e:
        print(f"Error in generate_recipes endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/recipe-details', methods=['POST', 'OPTIONS'])
def get_recipe_details():
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.json
        recipe_name = data.get('recipeName')
        ingredients = data.get('ingredients', [])
        
        if not recipe_name:
            return jsonify({'error': 'No recipe name provided'}), 400
        
        detailed_recipe = recipe_generator.generate_detailed_recipe(recipe_name, ingredients)
        nutrition_analysis = recipe_generator.get_nutrition_analysis(recipe_name, ingredients)
        
        if not detailed_recipe:
            return jsonify({'error': 'Failed to generate recipe details'}), 500
        
        return jsonify({
            'recipe': detailed_recipe,
            'nutritionAnalysis': nutrition_analysis
        })

    except Exception as e:
        print(f"Error in recipe details: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/nutrition-info', methods=['POST', 'OPTIONS'])
def get_nutrition_info():
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.json
        recipe_name = data.get('recipeName')
        ingredients = data.get('ingredients', [])
        
        nutrition_analysis = recipe_generator.get_nutrition_analysis(recipe_name, ingredients)
        
        if not nutrition_analysis:
            return jsonify({'error': 'Failed to generate nutrition information'}), 500
        
        return jsonify({
            'nutritionInfo': nutrition_analysis
        })

    except Exception as e:
        print(f"Error getting nutrition info: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/images/<filename>')
def serve_image(filename):
    """
    Serves images from the generated_recipes directory
    """
    try:
        # Ensure the filename is safe
        safe_filename = ''.join(c for c in filename if c.isalnum() or c in ['_', '.'])
        if not safe_filename.endswith('.png'):
            return 'Invalid file format', 400
            
        # Get the absolute path to the images directory
        image_dir = os.path.abspath(recipe_generator.image_folder)
        
        # Serve the image file
        return send_from_directory(
            image_dir, 
            safe_filename, 
            mimetype='image/png',
            as_attachment=False
        )
    except Exception as e:
        print(f"Error serving image {filename}: {str(e)}")
        return 'Image not found', 404

@app.route('/health')
def health():
    try:
        # Check if OpenAI API key is set
        if not openai.api_key:
            raise Exception("OpenAI API key not configured")
        
        return jsonify({
            "status": "healthy",
            "message": "Service is running"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500
        

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))